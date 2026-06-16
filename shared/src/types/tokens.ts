/**
 * Strict tuple defining the currently supported tokens.
 * Using `as const` allows us to derive the `TokenSymbol` union type dynamically.
 */
export const SUPPORTED_TOKENS = ["USDC", "ETH", "SOL", "USDT", "WBTC", "MATIC"] as const;

/**
 * Derived union type representing supported token symbols.
 */
export type TokenSymbol = typeof SUPPORTED_TOKENS[number];

/**
 * Decimal precision mapping for each supported token.
 */
export const TOKEN_DECIMALS: Record<TokenSymbol, number> = {
  USDC: 6,
  USDT: 6,
  SOL: 9,
  ETH: 18,
  WBTC: 8,
  MATIC: 18
};

/**
 * Native Solana SPL Mint Addresses (Wormhole equivalents).
 */
export const TOKEN_MINTS: Record<TokenSymbol, string> = {
  USDC:  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT:  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  SOL:   "So11111111111111111111111111111111111111112",   // Wrapped SOL
  ETH:   "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",  // Wormhole ETH
  WBTC:  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",  // Wormhole WBTC
  MATIC: "Gz7VkD4MacbEB6yC5XD3HcumEiYx2EtDYYrfikGsvopG",  // Wormhole MATIC
};

/**
 * Native Ethereum Contract Addresses for Paraswap / EVM Routing.
 */
export const EVM_TOKEN_ADDRESSES: Record<TokenSymbol, string> = {
  USDC:  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  USDT:  "0xdac17f958d2ee523a2206206994597c13d831ec7",
  SOL:   "0xd31a59c85ae9d8edefec411d448f90841571b89c",   // wSOL on ETH
  ETH:   "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",  // Native ETH placeholder
  WBTC:  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  MATIC: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
};

/**
 * Reverse mapping utility to find a TokenSymbol from a given Solana SPL Mint string.
 */
export const MINT_TO_TOKEN_OPTION: Record<string, TokenSymbol> = Object.entries(TOKEN_MINTS).reduce((acc, [key, value]) => {
  acc[value] = key as TokenSymbol;
  return acc;
}, {} as Record<string, TokenSymbol>);
