/**
 * Strict tuple defining the currently supported blockchain networks.
 * Using `as const` allows us to derive the `SupportedChain` union type dynamically.
 */
export declare const SUPPORTED_CHAINS: readonly ["Ethereum", "Solana", "Arbitrum", "Base", "Polygon", "Avalanche", "Optimism", "BSC"];
/**
 * Derived union type representing supported chains (e.g., "Ethereum" | "Solana" | ...).
 */
export type SupportedChain = typeof SUPPORTED_CHAINS[number];
/**
 * Maps standard chain names to their canonical Chain IDs.
 * Acts as the single source of truth across the monorepo.
 */
export declare const CHAIN_IDS: Record<SupportedChain, number>;
/**
 * A stricter type constraint for valid Chain ID numbers.
 */
export type ChainId = typeof CHAIN_IDS[SupportedChain];
/**
 * Maps standard Chain IDs to their CoinGecko asset ID for price fetching.
 */
export declare const COINGECKO_IDS: Record<number, string>;
