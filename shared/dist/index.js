"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertIntoRawUnits = exports.COINGECKO_IDS = exports.CHAINS = exports.CHAIN_IDS = exports.MINT_TO_TOKEN_OPTION = exports.EVM_TOKEN_ADDRESSES = exports.TOKEN_MINTS = exports.TOKEN_DECIMALS = exports.TOKEN_OPTIONS = exports.CHAIN_OPTIONS = void 0;
exports.CHAIN_OPTIONS = ["Etherium", "Solana", "Arbitrum", "Base", "Polygon"];
exports.TOKEN_OPTIONS = ["USDC", "ETH", "SOL", "USDT", "WBTC", "MATIC"];
exports.TOKEN_DECIMALS = {
    USDC: 6,
    USDT: 6,
    SOL: 9,
    ETH: 18,
    WBTC: 8,
    MATIC: 18
};
exports.TOKEN_MINTS = {
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    SOL: "So11111111111111111111111111111111111111112", // Wrapped SOL
    ETH: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs", // Wormhole ETH
    WBTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh", // Wormhole WBTC
    MATIC: "Gz7VkD4MacbEB6yC5XD3HcumEiYx2EtDYYrfikGsvopG", // Wormhole MATIC
};
// Native Ethereum (Chain 1) Contract Addresses for Paraswap
exports.EVM_TOKEN_ADDRESSES = {
    USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    SOL: "0xd31a59c85ae9d8edefec411d448f90841571b89c", // wSOL on ETH
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH placeholder
    WBTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    MATIC: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
};
exports.MINT_TO_TOKEN_OPTION = Object.entries(exports.TOKEN_MINTS).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});
exports.CHAIN_IDS = {
    Solana: 1,
    Etherium: 2,
    Arbitrum: 23,
    Base: 30,
    Polygon: 5,
};
exports.CHAINS = {
    SOLANA: 1,
    ETHEREUM: 2,
    BSC: 4,
    POLYGON: 5,
    AVALANCHE: 6,
    ARBITRUM: 23,
    OPTIMISM: 24,
    BASE: 30,
};
exports.COINGECKO_IDS = {
    2: "ethereum",
    4: "binancecoin",
    5: "matic-network",
    23: "ethereum",
    24: "ethereum",
    30: "ethereum",
};
// --- Utilities ---
const convertIntoRawUnits = (tokenType, input) => {
    if (!input) {
        return null;
    }
    if (typeof input === "number" && input > 0) {
        return input * Math.pow(10, exports.TOKEN_DECIMALS[tokenType]);
    }
    return null;
};
exports.convertIntoRawUnits = convertIntoRawUnits;
