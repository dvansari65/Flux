use anchor_lang::prelude::*;

/// Wormhole chain IDs for every destination the frontend supports.
/// Mirrors `CHAIN_IDS` in shared/src/types/chains.ts.
pub const SUPPORTED_DESTINATION_CHAINS: [u16; 8] = [
    1,  // Solana
    2,  // Ethereum
    4,  // BSC
    5,  // Polygon
    6,  // Avalanche
    23, // Arbitrum
    24, // Optimism
    30, // Base
];

pub const FULFILLMENT_PAYLOAD_ID: u8 = 1;

pub const WORMHOLE_VERIFY_VAA_SHIM_ID: Pubkey =
    pubkey!("EFaNWErqAtVWufdNb7yofSHHfWFos843DFpu4JBw24at");

/// Solana Wormhole core bridge — devnet/testnet cluster.
pub const WORMHOLE_CORE_BRIDGE_DEVNET: Pubkey =
    pubkey!("3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5");

/// Solana Wormhole core bridge — mainnet-beta cluster.
pub const WORMHOLE_CORE_BRIDGE_MAINNET: Pubkey =
    pubkey!("worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth");

pub fn is_supported_destination_chain(chain: u16) -> bool {
    SUPPORTED_DESTINATION_CHAINS.contains(&chain)
}

#[account]
#[derive(InitSpace, Debug)]
pub struct EscrowConfig {
    pub owner: Pubkey,
    pub wormhole_core_bridge: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace, Debug)]
pub struct RegisteredEmitter {
    /// Wormhole chain ID (must match order.destination_chain)
    pub chain: u16,
    /// FluxFill emitter address in Wormhole 32-byte format
    pub address: [u8; 32],
    pub bump: u8,
}

/// Marks a Wormhole VAA sequence as consumed so it cannot settle twice.
#[account]
#[derive(InitSpace, Debug)]
pub struct ConsumedVaa {
    pub emitter_chain: u16,
    pub emitter_address: [u8; 32],
    pub sequence: u64,
    pub order: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace, Debug)]
pub struct Order {
    /// User who created intent
    pub maker: Pubkey,

    /// SPL token mint being deposited
    pub input_mint: Pubkey,

    #[max_len(64)]
    pub output_mint: String,

    /// Amount locked in escrow
    pub input_amount: u64,

    /// Minimum acceptable output
    pub min_output_amount: u64,

    /// Destination chain identifier (Wormhole chain ID)
    pub destination_chain: u16,

    /// Recipient on destination chain
    #[max_len(64)]
    pub recipient: String,

    /// Unique replay protection
    pub nonce: u64,

    /// Order expiration
    pub deadline: i64,

    /// Winning solver (optional initially)
    pub solver: Option<Pubkey>,

    /// Current lifecycle state
    pub status: OrderStatus,

    /// Creation timestamp
    pub created_at: i64,
    pub order_bump: u8,
    pub vault_bump: u8,

    pub current_best_bid: u64,
    pub current_best_bond: u64,
    pub auction_end_in: i64,
    pub bid_count: u64,
}

#[derive(Clone, PartialEq, Eq, AnchorDeserialize, AnchorSerialize, InitSpace, Debug)]
pub enum OrderStatus {
    Created,
    AuctionRunning,
    Fulfilled,
    Settled,
    Cancelled,
    SourceSettled,
    DestinationSettled,
    PartiallyFilled,
    Failed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GrabIntentArgs {
    pub input_mint: Pubkey,
    pub output_mint: String,
    pub input_amount: u64,
    pub min_output_amount: u64,
    pub destination_chain: u16,
    pub recipient: String,
    pub deadline: i64,
    pub nonce: u64,
}

/// Cross-chain fulfillment payload published by FluxFill on the destination chain.
/// Binary layout (big-endian numerics for EVM/Solana parity):
///   u8 payload_id
///   [32] order Pubkey
///   u64 amount
///   u16 recipient_len + recipient bytes (UTF-8)
///   u16 destination_chain
///   u16 output_mint_len + output_mint bytes (UTF-8)
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FulfillmentPayload {
    pub order: Pubkey,
    pub amount: u64,
    pub recipient: String,
    pub destination_chain: u16,
    pub output_mint: String,
}

#[account]
#[derive(Debug, InitSpace)]
pub struct VaultState {
    pub owner: Pubkey,
    pub vault_bump: u8,
    pub is_locked: bool,
}

#[error_code]
pub enum EscrowError {
    #[msg("Invalid Request")]
    InvalidRequest,
    #[msg("Deadline passed!")]
    DeadlineInPast,
    #[msg("zero amount!")]
    ZeroAmount,
    #[msg("Auction expired! Try again!")]
    AuctionExpired,
    #[msg("Bid Price must be greater than 0")]
    InvalidInput,
    #[msg("User expects much more amount , Please bid using higher amount!")]
    InvalidAmount,
    #[msg("Balance is too low!")]
    InsufficientBalance,
    #[msg("Unauthorized request!")]
    UnauthorizedReq,
    #[msg("Auction not expired!")]
    AuctionNotExpired,
    #[msg("Intent already fulfilled!")]
    AlreadyFulFilled,
    #[msg("Winner not found!")]
    NoWinner,
    #[msg("Insufficient balance in vault account!")]
    VaultInsufficientBalance,
    #[msg("Order not fulfilled on destination chain yet")]
    NotFulfilled,
    #[msg("Invalid or malformed Wormhole VAA")]
    InvalidVaa,
    #[msg("Invalid fulfillment payload")]
    InvalidPayload,
    #[msg("Unsupported destination chain")]
    UnsupportedChain,
    #[msg("VAA already consumed")]
    VaaAlreadyConsumed,
    #[msg("Untrusted Wormhole emitter")]
    InvalidEmitter,
    #[msg("Fulfillment arrived after order deadline")]
    FulfillmentTooLate,
}

#[event]
#[derive(Clone)]
pub struct IntentCreated {
    pub order: Pubkey,
    pub maker: Pubkey,
    pub amount: u64,
    pub destination_chain: u16,
    pub nonce: u64,
    pub output_mint: String,
    pub input_mint: Pubkey,
    pub min_output_amount: u64,
    pub intent_status: OrderStatus,
}

#[event]
#[derive(Debug, Clone)]
pub struct BidPlaced {
    pub solver: Option<Pubkey>,
    pub bond_amount: u64,
    pub order: Order,
    pub sequence_num: u64,
    pub bond_vault: Option<Pubkey>,
}

#[event]
#[derive(Debug, Clone)]
pub struct ClaimedRefund {
    pub solver: Option<Pubkey>,
    pub bond_amount: u64,
    pub order: Order,
    pub sequence_num: u64,
    pub bond_vault: Option<Pubkey>,
}

#[event]
#[derive(Clone)]
pub struct EmitterRegistered {
    pub chain: u16,
    pub emitter: [u8; 32],
}

#[event]
#[derive(Clone)]
pub struct IntentFulfilled {
    pub order: Pubkey,
    pub solver: Pubkey,
    pub destination_chain: u16,
    pub amount: u64,
    pub wormhole_sequence: u64,
    pub emitter: [u8; 32],
}

#[event]
#[derive(Clone)]
pub struct AuctionSettled {
    pub order: Pubkey,
    pub solver: Pubkey,
    pub input_amount: u64,
}
