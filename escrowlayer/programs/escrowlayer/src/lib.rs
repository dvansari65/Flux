use anchor_lang::prelude::*;
use anchor_spl::token::{ Mint, Token, TokenAccount,Transfer};
use crate::state::{GrabIntentArgs, Order};
use crate::state::{EscrowError, IntentCreated, OrderStatus};

declare_id!("ArswYpDMRf9gP7EExY1pGRaw9Ym18X3fSPkApWAjyZad");
pub mod state;
#[program]
pub mod escrowlayer {


use anchor_spl::token;

use crate::state::BidPlaced;

use super::*;

    pub fn grab_intent(ctx: Context<GrabIntent>,args:GrabIntentArgs) -> Result<()> {
        
        let order = &mut ctx.accounts.order;
        require!(args.input_amount > 0, EscrowError::ZeroAmount);
        require!(args.min_output_amount > 0, EscrowError::ZeroAmount);
        require!(
            args.deadline > Clock::get()?.unix_timestamp,
            EscrowError::DeadlineInPast
        );
        let maker = ctx.accounts.maker.key();
        let output_mint = args.output_mint;
        order.maker = maker;
        order.input_mint = args.input_mint;
        order.output_mint = output_mint.clone();
        order.input_amount = args.input_amount;
        order.min_output_amount = args.min_output_amount;

        order.destination_chain = args.destination_chain;
        order.recipient = args.recipient;

        order.nonce = args.nonce;
        order.deadline = args.deadline;

        order.solver = None;
        order.status = OrderStatus::Created;

        order.created_at = Clock::get()?.unix_timestamp;
        order.order_bump = ctx.bumps.order;
        order.vault_bump = ctx.bumps.vault;

        order.current_best_bid = 0;
        order.auction_end_in = Clock::get()?.unix_timestamp + 10000;
        order.bid_count = 0;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.maker_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority:ctx.accounts.maker.to_account_info()
            }
        );
        token::transfer(cpi_ctx, args.input_amount)?;

        emit!(IntentCreated {
            order:order.key(),
            maker,
            amount:order.input_amount,
            destination_chain:order.destination_chain,
            nonce:order.nonce,
            output_mint:output_mint,
            input_mint:order.input_mint,
            min_output_amount:args.min_output_amount,
            intent_status:OrderStatus::Created
        });
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
   pub fn place_bid(ctx: Context<PlaceBid>,bid_price:u64,bond_amount:u64)->Result<()>{
    let current_time = Clock::get()?.unix_timestamp;
    let order = &mut ctx.accounts.order;
    let bidder = &mut ctx.accounts.bidder;
    let bond_vault = &mut ctx.accounts.bond_vault;
    let bidder_bond_token_account = &mut ctx.accounts.bidder_bond_token_account;
    
    require!(bid_price > 0,EscrowError::InvalidInput);
    require!(bid_price > order.min_output_amount ,EscrowError::InvalidAmount );
    require!(current_time < order.auction_end_in, EscrowError::AuctionExpired);
    let min_increment_bps =  100u128;
    let prev = order.current_best_bid as u128;

    let required = prev + ( prev * min_increment_bps)/10_000u128; 
    require!((bid_price as u128) > required || order.current_best_bid == 0u64, EscrowError::InvalidAmount );
    require!(order.status == OrderStatus::Created || order.status == OrderStatus::AuctionRunning, EscrowError::AuctionExpired);

    order.status = OrderStatus::AuctionRunning;
    
    let cpi_accounts = token::Transfer {
        from : bidder_bond_token_account.to_account_info(),
        to: bond_vault.to_account_info(),
        authority:bidder.to_account_info()
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, bond_amount)?;
    
    order.current_best_bid = bid_price;
    order.solver = Some(bidder.key());
    order.current_best_bond = bond_amount;
    order.bid_count += 1;

    emit!(BidPlaced {
        solver:Some(bidder.key()),
        bond_amount:bond_amount,
        order:order.clone().into_inner(),
        sequence_num:order.bid_count,
        bond_vault:Some(bond_vault.key())
    });
    // anti sipping mechanism
    let extend_sec:i64 = 60;
    if (order.auction_end_in - current_time) <= extend_sec {
        order.auction_end_in += order.auction_end_in + extend_sec
    }
    Ok(())
   }
   pub fn claim_refund(ctx: Context<ClaimRefund>)-> Result<()>{
    let order = &mut ctx.accounts.order;
    let bond_vault =  &mut ctx.accounts.bond_vault;
    let bidder = &mut ctx.accounts.bidder;
    let order_key = order.key();
    let bidder_key = bidder.key();

    require!(
        order.status == OrderStatus::Settled,
        EscrowError::AuctionNotExpired
    );
    require!(bond_vault.amount > 0, EscrowError::InsufficientBalance);
    require!(
        order.solver != Some(bidder_key),
        EscrowError::UnauthorizedReq
    );
    let bump = ctx.bumps.bond_vault;
    let  seeds = [b"bond",order_key.as_ref(),bidder_key.as_ref(),&[bump]];
    let signer = &[&seeds[..]];
    let ctx_accounts = token::Transfer {
        from:bond_vault.to_account_info(),
        to:ctx.accounts.bidder_bond_token_account.to_account_info(),
        authority:bond_vault.to_account_info()
    };
    let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), ctx_accounts,signer);
    token::transfer(cpi_ctx, order.current_best_bond)?;
    
    Ok(())
   }
   pub fn settle_auction(ctx: Context<SettleAuction>)->Result<()>{
    let order = &mut ctx.accounts.order;
    // TODO: we have to change this maker 
    let maker = &mut ctx.accounts.maker;
    let vault = &mut ctx.accounts.vault;
    let winner_token_account = &mut ctx.accounts.winner_token_account;
    let current_time = Clock::get()?.unix_timestamp;
    let winner = order.solver.unwrap();

    require!(winner == winner_token_account.owner, EscrowError::InvalidRequest);
    require!(order.input_amount <= vault.amount , EscrowError::VaultInsufficientBalance);
    require!(vault.amount > 0 , EscrowError::InsufficientBalance);
    require!(order.auction_end_in <= current_time, EscrowError::AuctionNotExpired);
    require!(order.status == OrderStatus::AuctionRunning,EscrowError::AuctionExpired);

    let maker_key = maker.key();
    let seeds = [b"vault", maker_key.as_ref(),&order.nonce.to_le_bytes(),&[ctx.bumps.vault]];
  
    let signer = &[&seeds[..]];
    // only solver gets filled , we want prooof that user also gets filled on dest chain 
    let ctx_accounts = token::Transfer {
        from:vault.to_account_info(),
        to:winner_token_account.to_account_info(),
        authority:vault.to_account_info()
    };
    let ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), ctx_accounts,signer);
    token::transfer(ctx, order.input_amount)?;
    // NOTE: solver is settled here not , we dont know user who signs the intent is fullfilled or not !
    order.status = OrderStatus::Settled;

    Ok(())
   }
}

#[derive(Accounts)]
#[instruction(args:GrabIntentArgs)]
pub struct GrabIntent<'info> {
    #[account(mut)]
    pub maker:Signer<'info>,

    #[account(
        init,
        payer = maker,
        space = 8 + Order::INIT_SPACE,
        seeds = [
            b"order",
            maker.key().as_ref(),
            &args.nonce.to_le_bytes()
        ],
        bump
    )]
    pub order : Account<'info,Order>,
    /// Per-intent token vault PDA — holds locked tokens
    /// seeds include nonce so each intent gets its own vault
    #[account(
        init,
        payer = maker,
        token::mint = input_mint,
        token::authority = vault,
        seeds = [b"vault", maker.key().as_ref(), &args.nonce.to_le_bytes()],
        bump  
    )]
    pub vault : Account<'info,TokenAccount>,
    
    pub input_mint : Account<'info,Mint>,

    #[account(
        mut,
        token::mint = input_mint,
        token::authority = maker
    )]
    pub maker_token_account : Account<'info,TokenAccount>,

    pub token_program : Program<'info,Token>,
    pub system_program : Program<'info,System>
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub bidder:Signer<'info>,

    #[account(mut)]
    pub order : Account<'info,Order>,

     /// bidder's token account for bond (from which we will transfer)
     #[account(mut , token::mint = bond_mint, token::authority = bidder)]
     pub bidder_bond_token_account : Account<'info,TokenAccount>, 

    #[account(
        init_if_needed,
        payer = bidder,
        token::mint = bond_mint,
        token::authority = bond_vault,
        seeds = [b"bond",order.key().as_ref(),bidder.key().as_ref()],
        bump
    )]
    pub bond_vault : Account<'info,TokenAccount>,
    /// the mint of the bond token (same for all bidders)
    pub bond_mint: Account<'info,Mint>,

    pub token_program : Program<'info,Token>,
    pub system_program : Program<'info,System>
}

#[derive(Accounts)]
pub struct  ClaimRefund<'info> {
    #[account(mut)]
    pub order: Account<'info,Order>,

    #[account(mut)] 
    pub bidder: Signer<'info>,

    #[account(seeds = [b"bond",order.key().as_ref(),bidder.key.as_ref()],bump)]
    pub bond_vault: Account<'info, TokenAccount>,

    pub bond_mint : Account<'info,Mint>,

    #[account(mut, token::mint = bond_mint)]
    pub bidder_bond_token_account:Account<'info, TokenAccount>,

    pub system_program : Program<'info, System>,
    pub token_program : Program<'info,Token>
}

#[derive(Accounts)]
pub struct SettleAuction <'info> {
    #[account(mut)]
    pub order :Account<'info,Order>,

    #[account(mut,seeds = [b"vault",maker.key().as_ref(),&order.nonce.to_le_bytes()],bump)]
    pub vault : Account<'info,TokenAccount>,

    #[account(mut)]
    pub maker : Signer<'info>,

    #[account(mut)]
    pub winner_token_account : Account<'info,TokenAccount>,

    pub token_program: Program<'info,Token>
}
