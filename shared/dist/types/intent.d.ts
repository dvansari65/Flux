import { PublicKey } from "@solana/web3.js";
import type { SupportedChain, ChainId } from "./chains";
import type { TokenSymbol } from "./tokens";
/**
 * Domain model representing the raw intent structure from the frontend before serialization.
 */
export interface Intent {
    sourceChain: SupportedChain;
    destChain: SupportedChain;
    inputToken: TokenSymbol;
    outputToken: TokenSymbol;
    /** Input amount formatted as a string (e.g. "1.5" SOL) */
    inputAmount: string;
    /** Minimum output amount formatted as a string (e.g. "2000" USDC) */
    minOutputAmount: string;
    senderAddress: string;
    recipientAddr: string;
    /** Unix timestamp in seconds representing the order expiration */
    deadline: number;
    /** Unique random identifier to prevent replay attacks */
    nonce: number;
}
/**
 * Serialized arguments required by the Escrowlayer smart contract to lock an intent.
 */
export interface IntentArgs {
    /** The SPL Mint address of the input token on Solana */
    inputMint: string;
    /** The SPL Mint address of the output token (or its Wormhole equivalent) */
    outputMint: string;
    /** The raw input amount in the token's smallest unit (e.g., lamports) */
    inputAmount: number;
    /** The raw minimum output amount acceptable by the user */
    minOutputAmount: number;
    /** The canonical chain ID of the destination network */
    destinationChain: ChainId;
    /** The target recipient's public key or address */
    recipient: PublicKey;
    /** Unix timestamp in seconds representing the order expiration */
    deadline: number;
    /** Unique random identifier to prevent replay attacks */
    nonce: number;
}
/**
 * Response structure from the Jupiter Aggregator API.
 */
export interface JupiterQuote {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    priceImpactPct: string;
}
