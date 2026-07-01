use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};

use crate::state::{
    AuctionSettled, BidPlaced, ConsumedVaa, EmitterRegistered, EscrowConfig, EscrowError,
    GrabIntentArgs, IntentCreated, IntentFulfilled, Order, OrderStatus, RegisteredEmitter,
    is_supported_destination_chain,
};
use crate::wormhole::{
    close_guardian_signatures, compute_vaa_digest, decode_fulfillment_payload, parse_vaa_body,
    verify_vaa_hash,
};

declare_id!("ArswYpDMRf9gP7EExY1pGRaw9Ym18X3fSPkApWAjyZad");

pub mod state;
pub mod wormhole;

#[program]
pub mod escrowlayer {
    use super::*;
    use anchor_spl::token;

    /// One-time setup: stores admin + Wormhole core bridge program id for this cluster.
    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.owner = ctx.accounts.owner.key();
        config.wormhole_core_bridge = ctx.accounts.wormhole_core_bridge.key();
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Register the trusted FluxFill emitter for a destination Wormhole chain.
    /// Supports: Solana(1), Ethereum(2), BSC(4), Polygon(5), Avalanche(6),
    /// Arbitrum(23), Optimism(24), Base(30).
    pub fn register_emitter(
        ctx: Context<RegisterEmitter>,
        chain: u16,
        emitter: [u8; 32],
    ) -> Result<()> {
        require!(is_supported_destination_chain(chain), EscrowError::UnsupportedChain);
        require!(
            !emitter.iter().all(|byte| *byte == 0),
            EscrowError::InvalidEmitter
        );

        let registered = &mut ctx.accounts.registered_emitter;
        registered.chain = chain;
        registered.address = emitter;
        registered.bump = ctx.bumps.registered_emitter;

        emit!(EmitterRegistered {
            chain,
            emitter,
        });
        Ok(())
    }

    pub fn grab_intent(ctx: Context<GrabIntent>, args: GrabIntentArgs) -> Result<()> {
        require!(is_supported_destination_chain(args.destination_chain), EscrowError::UnsupportedChain);
        require!(args.input_amount > 0, EscrowError::ZeroAmount);
        require!(args.min_output_amount > 0, EscrowError::ZeroAmount);
        require!(
            args.deadline > Clock::get()?.unix_timestamp,
            EscrowError::DeadlineInPast
        );
        require!(!args.recipient.is_empty(), EscrowError::InvalidRequest);
        require!(!args.output_mint.is_empty(), EscrowError::InvalidRequest);

        let order = &mut ctx.accounts.order;
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
        order.current_best_bond = 0;
        order.auction_end_in = Clock::get()?.unix_timestamp + 10000;
        order.bid_count = 0;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.maker_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.maker.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, args.input_amount)?;

        emit!(IntentCreated {
            order: order.key(),
            maker,
            amount: order.input_amount,
            destination_chain: order.destination_chain,
            nonce: order.nonce,
            output_mint,
            input_mint: order.input_mint,
            min_output_amount: args.min_output_amount,
            intent_status: OrderStatus::Created,
        });
        Ok(())
    }

    pub fn place_bid(ctx: Context<PlaceBid>, bid_price: u64, bond_amount: u64) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        let order = &mut ctx.accounts.order;
        let bidder = &ctx.accounts.bidder;
        let bond_vault = &ctx.accounts.bond_vault;
        let bidder_bond_token_account = &ctx.accounts.bidder_bond_token_account;

        require!(bid_price > 0, EscrowError::InvalidInput);
        require!(bid_price > order.min_output_amount, EscrowError::InvalidAmount);
        require!(current_time < order.auction_end_in, EscrowError::AuctionExpired);
        require!(bond_amount > 0, EscrowError::ZeroAmount);

        let min_increment_bps = 100u128;
        let prev = order.current_best_bid as u128;
        let required = prev + (prev * min_increment_bps) / 10_000u128;
        require!(
            (bid_price as u128) > required || order.current_best_bid == 0u64,
            EscrowError::InvalidAmount
        );
        require!(
            order.status == OrderStatus::Created || order.status == OrderStatus::AuctionRunning,
            EscrowError::AuctionExpired
        );

        order.status = OrderStatus::AuctionRunning;

        let cpi_accounts = token::Transfer {
            from: bidder_bond_token_account.to_account_info(),
            to: bond_vault.to_account_info(),
            authority: bidder.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, bond_amount)?;

        order.current_best_bid = bid_price;
        order.solver = Some(bidder.key());
        order.current_best_bond = bond_amount;
        order.bid_count += 1;

        emit!(BidPlaced {
            solver: Some(bidder.key()),
            bond_amount,
            order: order.clone().into_inner(),
            sequence_num: order.bid_count,
            bond_vault: Some(bond_vault.key()),
        });

        // Anti-sniping: extend auction if a bid lands in the final minute.
        let extend_sec: i64 = 60;
        if (order.auction_end_in - current_time) <= extend_sec {
            order.auction_end_in += extend_sec;
        }
        Ok(())
    }

    /// Verify a Wormhole VAA proving the solver delivered on the destination chain.
    ///
    /// Client must call `post_signatures` on the Wormhole Verification Shim before this ix.
    /// This instruction CPIs `verify_hash`, validates payload against the Order, then closes
    /// the guardian signatures account to reclaim rent.
    pub fn submit_fulfillment_proof(
        ctx: Context<SubmitFulfillmentProof>,
        guardian_set_index: u32,
        guardian_set_bump: u8,
        wormhole_sequence: u64,
        vaa_body: Vec<u8>,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let order = &mut ctx.accounts.order;
        let solver_key = ctx.accounts.solver.key();

        require!(order.solver == Some(solver_key), EscrowError::UnauthorizedReq);
        require!(clock.unix_timestamp >= order.auction_end_in, EscrowError::AuctionNotExpired);
        require!(
            order.status == OrderStatus::AuctionRunning,
            EscrowError::AuctionExpired
        );

        let digest = compute_vaa_digest(&vaa_body);
        verify_vaa_hash(
            &ctx.accounts.wormhole_verify_vaa_shim,
            ctx.accounts.guardian_set.to_account_info(),
            ctx.accounts.guardian_signatures.to_account_info(),
            guardian_set_bump,
            digest,
        )?;

        let parsed_vaa = parse_vaa_body(&vaa_body)?;
        let fulfillment = decode_fulfillment_payload(&parsed_vaa.payload)?;

        let registered = &ctx.accounts.registered_emitter;
        require!(
            parsed_vaa.emitter_chain == order.destination_chain,
            EscrowError::InvalidEmitter
        );
        require!(
            parsed_vaa.emitter_chain == registered.chain,
            EscrowError::InvalidEmitter
        );
        require!(
            parsed_vaa.emitter_address == registered.address,
            EscrowError::InvalidEmitter
        );
        require!(fulfillment.order == order.key(), EscrowError::InvalidPayload);
        require!(
            fulfillment.destination_chain == order.destination_chain,
            EscrowError::InvalidPayload
        );
        require!(fulfillment.recipient == order.recipient, EscrowError::InvalidPayload);
        require!(fulfillment.output_mint == order.output_mint, EscrowError::InvalidPayload);
        require!(
            fulfillment.amount >= order.current_best_bid,
            EscrowError::InvalidAmount
        );
        require!(
            i64::from(parsed_vaa.timestamp) <= order.deadline,
            EscrowError::FulfillmentTooLate
        );
        require!(
            parsed_vaa.sequence == wormhole_sequence,
            EscrowError::InvalidVaa
        );

        let consumed = &mut ctx.accounts.consumed_vaa;
        consumed.emitter_chain = parsed_vaa.emitter_chain;
        consumed.emitter_address = parsed_vaa.emitter_address;
        consumed.sequence = parsed_vaa.sequence;
        consumed.order = order.key();
        consumed.bump = ctx.bumps.consumed_vaa;

        order.status = OrderStatus::Fulfilled;

        close_guardian_signatures(
            &ctx.accounts.wormhole_verify_vaa_shim,
            ctx.accounts.guardian_signatures.to_account_info(),
            ctx.accounts.refund_recipient.to_account_info(),
        )?;

        emit!(IntentFulfilled {
            order: order.key(),
            solver: solver_key,
            destination_chain: order.destination_chain,
            amount: fulfillment.amount,
            wormhole_sequence: parsed_vaa.sequence,
            emitter: parsed_vaa.emitter_address,
        });

        let _ = guardian_set_index;
        Ok(())
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let order = &ctx.accounts.order;
        let bond_vault = &ctx.accounts.bond_vault;
        let bidder = &ctx.accounts.bidder;
        let order_key = order.key();
        let bidder_key = bidder.key();
        let refund_amount = bond_vault.amount;

        require!(order.status == OrderStatus::Settled, EscrowError::AuctionNotExpired);
        require!(refund_amount > 0, EscrowError::InsufficientBalance);
        require!(order.solver != Some(bidder_key), EscrowError::UnauthorizedReq);

        let bump = ctx.bumps.bond_vault;
        let seeds = [b"bond", order_key.as_ref(), bidder_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];
        let ctx_accounts = token::Transfer {
            from: bond_vault.to_account_info(),
            to: ctx.accounts.bidder_bond_token_account.to_account_info(),
            authority: bond_vault.to_account_info(),
        };
        let cpi_ctx =
            CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), ctx_accounts, signer);
        token::transfer(cpi_ctx, refund_amount)?;

        Ok(())
    }

    pub fn settle_auction(ctx: Context<SettleAuction>) -> Result<()> {
        let order = &mut ctx.accounts.order;
        let maker = &ctx.accounts.maker;
        let vault = &ctx.accounts.vault;
        let winner_token_account = &ctx.accounts.winner_token_account;
        let current_time = Clock::get()?.unix_timestamp;
        let winner = order.solver.ok_or(EscrowError::NoWinner)?;

        require!(winner == winner_token_account.owner, EscrowError::InvalidRequest);
        require!(
            order.input_amount <= vault.amount,
            EscrowError::VaultInsufficientBalance
        );
        require!(vault.amount > 0, EscrowError::InsufficientBalance);
        require!(order.auction_end_in <= current_time, EscrowError::AuctionNotExpired);
        require!(order.status == OrderStatus::Fulfilled, EscrowError::NotFulfilled);

        let maker_key = maker.key();
        let seeds = [
            b"vault",
            maker_key.as_ref(),
            &order.nonce.to_le_bytes(),
            &[ctx.bumps.vault],
        ];
        let signer = &[&seeds[..]];

        let ctx_accounts = token::Transfer {
            from: vault.to_account_info(),
            to: winner_token_account.to_account_info(),
            authority: vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            ctx_accounts,
            signer,
        );
        token::transfer(cpi_ctx, order.input_amount)?;

        order.status = OrderStatus::Settled;

        emit!(AuctionSettled {
            order: order.key(),
            solver: winner,
            input_amount: order.input_amount,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + EscrowConfig::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, EscrowConfig>,

    /// Wormhole core bridge program for this cluster (devnet or mainnet).
    /// CHECK: Stored for guardian set derivation; validated at registration/verification time.
    pub wormhole_core_bridge: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(chain: u16)]
pub struct RegisterEmitter<'info> {
    #[account(
        mut,
        constraint = owner.key() == config.owner @ EscrowError::UnauthorizedReq
    )]
    pub owner: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, EscrowConfig>,

    #[account(
        init,
        payer = owner,
        space = 8 + RegisteredEmitter::INIT_SPACE,
        seeds = [b"emitter", chain.to_be_bytes().as_ref()],
        bump
    )]
    pub registered_emitter: Account<'info, RegisteredEmitter>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: GrabIntentArgs)]
pub struct GrabIntent<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        init,
        payer = maker,
        space = 8 + Order::INIT_SPACE,
        seeds = [b"order", maker.key().as_ref(), &args.nonce.to_le_bytes()],
        bump
    )]
    pub order: Account<'info, Order>,

    #[account(
        init,
        payer = maker,
        token::mint = input_mint,
        token::authority = vault,
        seeds = [b"vault", maker.key().as_ref(), &args.nonce.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    pub input_mint: Account<'info, Mint>,

    #[account(mut, token::mint = input_mint, token::authority = maker)]
    pub maker_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(mut)]
    pub order: Account<'info, Order>,

    #[account(mut, token::mint = bond_mint, token::authority = bidder)]
    pub bidder_bond_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = bidder,
        token::mint = bond_mint,
        token::authority = bond_vault,
        seeds = [b"bond", order.key().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub bond_vault: Account<'info, TokenAccount>,

    pub bond_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(guardian_set_index: u32, guardian_set_bump: u8, wormhole_sequence: u64)]
pub struct SubmitFulfillmentProof<'info> {
    #[account(mut)]
    pub solver: Signer<'info>,

    #[account(mut)]
    pub order: Account<'info, Order>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, EscrowConfig>,

    #[account(
        seeds = [b"emitter", &order.destination_chain.to_be_bytes()],
        bump = registered_emitter.bump,
        constraint = registered_emitter.chain == order.destination_chain @ EscrowError::InvalidEmitter
    )]
    pub registered_emitter: Account<'info, RegisteredEmitter>,

    #[account(
        init,
        payer = refund_recipient,
        space = 8 + ConsumedVaa::INIT_SPACE,
        seeds = [
            b"consumed_vaa",
            order.destination_chain.to_be_bytes().as_ref(),
            registered_emitter.address.as_ref(),
            wormhole_sequence.to_be_bytes().as_ref(),
        ],
        bump
    )]
    pub consumed_vaa: Account<'info, ConsumedVaa>,

    /// CHECK: Wormhole guardian set PDA — derivation enforced below.
    #[account(
        seeds = [b"GuardianSet", &guardian_set_index.to_be_bytes()],
        bump = guardian_set_bump,
        seeds::program = config.wormhole_core_bridge
    )]
    pub guardian_set: UncheckedAccount<'info>,

    /// CHECK: Temp account created by Wormhole Verification Shim `post_signatures`.
    pub guardian_signatures: UncheckedAccount<'info>,

    #[account(mut)]
    pub refund_recipient: Signer<'info>,

    pub wormhole_verify_vaa_shim: Program<'info, wormhole::WormholeVerifyVaaShim>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub order: Account<'info, Order>,

    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(seeds = [b"bond", order.key().as_ref(), bidder.key().as_ref()], bump)]
    pub bond_vault: Account<'info, TokenAccount>,

    pub bond_mint: Account<'info, Mint>,

    #[account(mut, token::mint = bond_mint)]
    pub bidder_bond_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SettleAuction<'info> {
    #[account(mut)]
    pub order: Account<'info, Order>,

    #[account(
        mut,
        seeds = [b"vault", maker.key().as_ref(), &order.nonce.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    pub maker: Signer<'info>,

    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
