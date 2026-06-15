// helpers/solana/estimateSolanaGas.ts
import { 
    Connection, 
    PublicKey
} from "@solana/web3.js"
import { 
    getAssociatedTokenAddress, 
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token"

const USDC_MINT_SOLANA = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")

// lamports for rent-exempt ATA account
const ATA_RENT_LAMPORTS = 2_039_280n  

// base fee per signature
const BASE_FEE_LAMPORTS = 5_000n      

// compute units for SPL transfer
const SPL_TRANSFER_COMPUTE_UNITS = 4_000n  

// compute units for ATA creation + transfer
const ATA_CREATE_COMPUTE_UNITS = 34_000n   

export async function estimateSolanaDelivery(
    connection: Connection,
    recipientBytes: Uint8Array,  // [u8;32] from your order
    outputMintBytes: Uint8Array  // [u8;32] from your order
): Promise<{
    estimatedLamports: bigint,
    needsATACreation: boolean,
    breakdown: {
        baseFee: bigint,
        priorityFee: bigint,
        rentFee: bigint,
    }
}> {
    // decode recipient pubkey from [u8;32]
    const recipient = new PublicKey(recipientBytes)
    const outputMint = new PublicKey(outputMintBytes)

    // STEP 1 — check if recipient already has a token account
    const recipientATA = await getAssociatedTokenAddress(
        outputMint,
        recipient,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    )

    const ataInfo = await connection.getAccountInfo(recipientATA)
    const needsATACreation = ataInfo === null  // null = doesn't exist yet

    // STEP 2 — get current priority fee from recent blocks
    const priorityFeePerUnit = await getRecentPriorityFee(connection)
    if(!priorityFeePerUnit){
        throw new Error("Priority fee per unit missing!")
    }
    // STEP 3 — calculate compute units needed
    const computeUnits = needsATACreation 
        ? ATA_CREATE_COMPUTE_UNITS 
        : SPL_TRANSFER_COMPUTE_UNITS

    // STEP 4 — calculate each component
    const baseFee = BASE_FEE_LAMPORTS
    const priorityFee = computeUnits * priorityFeePerUnit / 1_000_000n  // microlamports → lamports
    const rentFee = needsATACreation ? ATA_RENT_LAMPORTS : 0n

    const estimatedLamports = baseFee + priorityFee + rentFee

    console.log({
        needsATACreation,
        baseFee: baseFee.toString(),
        priorityFee: priorityFee.toString(),
        rentFee: rentFee.toString(),
        totalLamports: estimatedLamports.toString(),
    })

    return {
        estimatedLamports,
        needsATACreation,
        breakdown: { baseFee, priorityFee, rentFee }
    }
}

// get realistic priority fee from recent blocks
async function getRecentPriorityFee(connection: Connection): Promise<bigint | undefined> {
    const fees = await connection.getRecentPrioritizationFees()

    if (fees.length === 0) return 1000n  // fallback: 1000 microlamports

    // take 75th percentile — not too cheap, not too expensive
    const sorted = fees
        .map(f => BigInt(f.prioritizationFee))
        .sort((a, b) => (a < b ? -1 : 1))

    const p75Index = Math.floor(sorted.length * 0.75)
    return sorted[p75Index]
}
