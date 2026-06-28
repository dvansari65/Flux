use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace,Debug)]
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

    /// Destination chain identifier
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
    // ✅ Store bumps for PDA signing later
    pub order_bump: u8,
    pub vault_bump: u8,

    pub current_best_bid:u64,
    pub current_best_bond:u64,
    pub auction_end_in:i64,
    pub bid_count:u64 // using bid count as a sequence number in BidPlaced event 
}

#[derive(Clone, PartialEq, Eq, AnchorDeserialize, AnchorSerialize, InitSpace,Debug)]
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

#[derive(AnchorSerialize, AnchorDeserialize,Clone)]
pub struct GrabIntentArgs {
    pub input_mint: Pubkey,
    pub output_mint:String,
    pub input_amount: u64,
    pub min_output_amount: u64,
    pub destination_chain: u16,
    pub recipient: String,
    pub deadline: i64,
    pub nonce: u64,
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
    VaultInsufficientBalance
}

#[event]
#[derive(Clone)]
pub struct IntentCreated {
    pub order: Pubkey,
    pub maker: Pubkey,
    pub amount: u64,
    pub destination_chain: u16,
    pub nonce: u64,
    pub output_mint:String,
    pub input_mint:Pubkey,
     /// Minimum acceptable output
     pub min_output_amount: u64,
     pub intent_status:OrderStatus
}

#[event]
#[derive(Debug,Clone)]
pub struct BidPlaced {
    pub solver:Option<Pubkey>,
    pub bond_amount:u64,
    pub order:Order,
    pub sequence_num:u64,
    pub bond_vault:Option<Pubkey>
}
/*
pubkey of the solver
bond amount  NOTE: bond amount always in usd for refund to the solver 
order account 
sequence number
 */