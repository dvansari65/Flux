"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COINGECKO_IDS = exports.CHAIN_IDS = exports.SUPPORTED_CHAINS = void 0;
/**
 * Strict tuple defining the currently supported blockchain networks.
 * Using `as const` allows us to derive the `SupportedChain` union type dynamically.
 */
exports.SUPPORTED_CHAINS = ["Ethereum", "Solana", "Arbitrum", "Base", "Polygon", "Avalanche", "Optimism", "BSC"];
/**
 * Maps standard chain names to their canonical Chain IDs.
 * Acts as the single source of truth across the monorepo.
 */
exports.CHAIN_IDS = {
    Solana: 1,
    Ethereum: 2,
    BSC: 4,
    Polygon: 5,
    Avalanche: 6,
    Arbitrum: 23,
    Optimism: 24,
    Base: 30,
};
/**
 * Maps standard Chain IDs to their CoinGecko asset ID for price fetching.
 */
exports.COINGECKO_IDS = {
    2: "ethereum",
    4: "binancecoin",
    5: "matic-network",
    6: "avalanche-2",
    23: "ethereum",
    24: "ethereum",
    30: "ethereum",
};
