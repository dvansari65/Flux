use anchor_lang::prelude::*;

use crate::state::{
    EscrowError, FulfillmentPayload, FULFILLMENT_PAYLOAD_ID, WORMHOLE_VERIFY_VAA_SHIM_ID,
};

declare_program!(wormhole_verify_vaa_shim);

pub use wormhole_verify_vaa_shim::program::WormholeVerifyVaaShim;
use wormhole_verify_vaa_shim::cpi::accounts::{CloseSignatures, VerifyHash};

/// Parsed Wormhole VAA body (everything after guardian signatures).
#[derive(Clone, Debug)]
pub struct ParsedVaaBody {
    pub timestamp: u32,
    pub nonce: u32,
    pub emitter_chain: u16,
    pub emitter_address: [u8; 32],
    pub sequence: u64,
    pub consistency_level: u8,
    pub payload: Vec<u8>,
}

pub fn compute_vaa_digest(vaa_body: &[u8]) -> [u8; 32] {
    let message_hash = solana_keccak_hasher::hashv(&[vaa_body]).to_bytes();
    solana_keccak_hasher::hash(message_hash.as_slice()).to_bytes()
}

pub fn verify_vaa_hash<'info>(
    wormhole_verify_vaa_shim: &Program<'info, WormholeVerifyVaaShim>,
    guardian_set: AccountInfo<'info>,
    guardian_signatures: AccountInfo<'info>,
    guardian_set_bump: u8,
    digest: [u8; 32],
) -> Result<()> {
    wormhole_verify_vaa_shim::cpi::verify_hash(
        CpiContext::new(
            wormhole_verify_vaa_shim.to_account_info(),
            VerifyHash {
                guardian_set,
                guardian_signatures,
            },
        ),
        guardian_set_bump,
        digest,
    )
}

pub fn close_guardian_signatures<'info>(
    wormhole_verify_vaa_shim: &Program<'info, WormholeVerifyVaaShim>,
    guardian_signatures: AccountInfo<'info>,
    refund_recipient: AccountInfo<'info>,
) -> Result<()> {
    wormhole_verify_vaa_shim::cpi::close_signatures(CpiContext::new(
        wormhole_verify_vaa_shim.to_account_info(),
        CloseSignatures {
            guardian_signatures,
            refund_recipient,
        },
    ))
}

pub fn parse_vaa_body(vaa_body: &[u8]) -> Result<ParsedVaaBody> {
    // timestamp(4) + nonce(4) + emitter_chain(2) + emitter(32) + sequence(8) + consistency(1) = 51
    require!(vaa_body.len() >= 51, EscrowError::InvalidVaa);

    let timestamp = u32::from_be_bytes(vaa_body[0..4].try_into().unwrap());
    let nonce = u32::from_be_bytes(vaa_body[4..8].try_into().unwrap());
    let emitter_chain = u16::from_be_bytes(vaa_body[8..10].try_into().unwrap());
    let mut emitter_address = [0u8; 32];
    emitter_address.copy_from_slice(&vaa_body[10..42]);
    let sequence = u64::from_be_bytes(vaa_body[42..50].try_into().unwrap());
    let consistency_level = vaa_body[50];
    let payload = vaa_body[51..].to_vec();

    Ok(ParsedVaaBody {
        timestamp,
        nonce,
        emitter_chain,
        emitter_address,
        sequence,
        consistency_level,
        payload,
    })
}

pub fn decode_fulfillment_payload(payload: &[u8]) -> Result<FulfillmentPayload> {
    require!(!payload.is_empty(), EscrowError::InvalidPayload);
    require!(
        payload[0] == FULFILLMENT_PAYLOAD_ID,
        EscrowError::InvalidPayload
    );

    let mut offset = 1usize;
    require!(payload.len() >= offset + 32, EscrowError::InvalidPayload);
    let order = Pubkey::try_from(&payload[offset..offset + 32]).map_err(|_| error!(EscrowError::InvalidPayload))?;
    offset += 32;

    require!(payload.len() >= offset + 8, EscrowError::InvalidPayload);
    let amount = u64::from_be_bytes(payload[offset..offset + 8].try_into().unwrap());
    offset += 8;

    require!(payload.len() >= offset + 2, EscrowError::InvalidPayload);
    let recipient_len = u16::from_be_bytes(payload[offset..offset + 2].try_into().unwrap()) as usize;
    offset += 2;
    require!(payload.len() >= offset + recipient_len, EscrowError::InvalidPayload);
    let recipient = String::from_utf8(payload[offset..offset + recipient_len].to_vec())
        .map_err(|_| error!(EscrowError::InvalidPayload))?;
    offset += recipient_len;

    require!(payload.len() >= offset + 2, EscrowError::InvalidPayload);
    let destination_chain = u16::from_be_bytes(payload[offset..offset + 2].try_into().unwrap());
    offset += 2;

    require!(payload.len() >= offset + 2, EscrowError::InvalidPayload);
    let output_mint_len = u16::from_be_bytes(payload[offset..offset + 2].try_into().unwrap()) as usize;
    offset += 2;
    require!(payload.len() >= offset + output_mint_len, EscrowError::InvalidPayload);
    let output_mint = String::from_utf8(payload[offset..offset + output_mint_len].to_vec())
        .map_err(|_| error!(EscrowError::InvalidPayload))?;

    Ok(FulfillmentPayload {
        order,
        amount,
        recipient,
        destination_chain,
        output_mint,
    })
}

pub fn wormhole_shim_program_id() -> Pubkey {
    WORMHOLE_VERIFY_VAA_SHIM_ID
}
