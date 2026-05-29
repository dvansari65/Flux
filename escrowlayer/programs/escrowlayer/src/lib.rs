use anchor_lang::prelude::*;
use anchor_spl::token::{ Mint, Token, TokenAccount, Transfer};
use crate::state::{GrabIntentArgs, Order};
declare_id!("ArswYpDMRf9gP7EExY1pGRaw9Ym18X3fSPkApWAjyZad");
pub mod state;
#[program]
pub mod escrowlayer {
    

use anchor_spl::token;

use crate::state::{EscrowError, OrderStatus};

use super::*;

    pub fn grab_intent(ctx: Context<GrabIntent>,args:GrabIntentArgs) -> Result<()> {
        
        let order = &mut ctx.accounts.order;
        require!(args.input_amount > 0, EscrowError::ZeroAmount);
        require!(args.min_output_amount > 0, EscrowError::ZeroAmount);
        require!(
            args.deadline > Clock::get()?.unix_timestamp,
            EscrowError::DeadlineInPast
        );

        order.maker = ctx.accounts.maker.key();
        order.input_mint = args.input_mint;
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
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.maker_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority:ctx.accounts.maker.to_account_info()
            }
        );
        token::transfer(cpi_ctx, args.input_amount)?;

        msg!("Greetings from: {:?}", ctx.program_id);
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

