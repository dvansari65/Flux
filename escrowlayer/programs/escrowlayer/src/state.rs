use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Order {
    /// User who created intent
    pub maker: Pubkey,

    /// SPL token mint being deposited
    pub input_mint: Pubkey,

    /// Amount locked in escrow
    pub input_amount: u64,

    /// Minimum acceptable output
    pub min_output_amount: u64,

    /// Destination chain identifier
    pub destination_chain: u16,

    /// Recipient on destination chain
    #[max_len(32)]
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
}

#[derive(Clone, PartialEq, Eq, AnchorDeserialize, AnchorSerialize, InitSpace)]
pub enum OrderStatus {
    Created,
    AuctionRunning,
    Fulfilled,
    Settled,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GrabIntentArgs {
    pub input_mint: Pubkey,
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
    ZeroAmount
}