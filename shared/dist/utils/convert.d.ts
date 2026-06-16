import { TokenSymbol } from "../types/tokens";
/**
 * Normalizes a human-readable token amount (e.g., 1.5 SOL) into its raw blockchain
 * integer representation (e.g., 1500000000 lamports) based on the token's decimal precision.
 *
 * @param tokenType - The symbol of the token (e.g. "USDC", "SOL")
 * @param input - The human readable amount
 * @returns The raw integer amount, or null if input is invalid
 */
export declare const convertIntoRawUnits: (tokenType: TokenSymbol, input: number | null) => number | null;
