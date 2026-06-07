use anchor_lang::prelude::*;
use anchor_spl::token::{ Mint, Token, TokenAccount,Transfer,transfer};
use crate::state::{GrabIntentArgs, Order};
use crate::state::{EscrowError, IntentCreated, OrderStatus};

declare_id!("ArswYpDMRf9gP7EExY1pGRaw9Ym18X3fSPkApWAjyZad");
pub mod state;
#[program]
pub mod escrowlayer {


use anchor_spl::token;

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
            min_output_amount:args.min_output_amount
        });

        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
   pub fn place_bid(ctx: Context<PlaceBid>,bid_price:u64)->Result<()>{
    let current_time = Clock::get()?.unix_timestamp;
    let maker = &mut ctx.accounts.maker;
    let order = &mut ctx.accounts.order;

    require!(bid_price > 0,EscrowError::InvalidInput);

    if current_time > order.auction_end_in {
        return Err(EscrowError::AuctionExpired.into())
    }

    order.current_best_bid = bid_price;
    order.solver = Some(maker.key());

    order.bid_count += 1;
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
    pub maker:Signer<'info>,

    #[account(mut)]
    pub order : Account<'info,Order>,

    pub input_mint: Account<'info,Mint>,

    pub token_program : Program<'info,Token>,
    pub system_program : Program<'info,System>
}



