/**
 * Strict tuple defining the currently supported tokens.
 * Using `as const` allows us to derive the `TokenSymbol` union type dynamically.
 */
export declare const SUPPORTED_TOKENS: readonly ["USDC", "ETH", "SOL", "USDT", "WBTC", "MATIC"];
/**
 * Derived union type representing supported token symbols.
 */
export type TokenSymbol = typeof SUPPORTED_TOKENS[number];
/**
 * Decimal precision mapping for each supported token.
 */
export declare const TOKEN_DECIMALS: Record<TokenSymbol, number>;
/**
 * Native Solana SPL Mint Addresses (Wormhole equivalents).
 */
export declare const TOKEN_MINTS: Record<TokenSymbol, string>;
/**
 * Native Ethereum Contract Addresses for Paraswap / EVM Routing.
 */
export declare const EVM_TOKEN_ADDRESSES: Record<TokenSymbol, string>;
/**
 * Reverse mapping utility to find a TokenSymbol from a given Solana SPL Mint string.
 */
export declare const MINT_TO_TOKEN_OPTION: Record<string, TokenSymbol>;
