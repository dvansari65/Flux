/**
 * Strict tuple defining the currently supported blockchain networks.
 * Using `as const` allows us to derive the `SupportedChain` union type dynamically.
 */
export const SUPPORTED_CHAINS = ["Ethereum", "Solana", "Arbitrum", "Base", "Polygon", "Avalanche", "Optimism", "BSC"] as const;

/**
 * Derived union type representing supported chains (e.g., "Ethereum" | "Solana" | ...).
 */
export type SupportedChain = typeof SUPPORTED_CHAINS[number];

/**
 * Maps standard chain names to their canonical Chain IDs.
 * Acts as the single source of truth across the monorepo.
 */
export const CHAIN_IDS: Record<SupportedChain, number> = {
  Solana:    1,
  Ethereum:  2,
  BSC:       4,
  Polygon:   5,
  Avalanche: 6,
  Arbitrum:  23,
  Optimism:  24,
  Base:      30,
};

/**
 * A stricter type constraint for valid Chain ID numbers.
 */
export type ChainId = typeof CHAIN_IDS[SupportedChain];

/**
 * Maps standard Chain IDs to their CoinGecko asset ID for price fetching.
 */
export const COINGECKO_IDS: Record<number, string> = {
    2:  "ethereum",
    4:  "binancecoin",
    5:  "matic-network",
    6:  "avalanche-2",
    23: "ethereum",   
    24: "ethereum",   
    30: "ethereum",   
};
