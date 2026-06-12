import { arbitrum, avalanche, base, bsc, mainnet, optimism, polygon } from "viem/chains";
export type ChainOptions = "Etherium" | "Solana" | "Arbitrum" | "Base" | "Polygon"

export const CHAIN_OPTIONS: ChainOptions[] = ["Etherium", "Solana", "Arbitrum", "Base", "Polygon"]
// eth  poly  arb   sol
export type ChainIds = 1 | 2 | 4 | 5 | 6 | 23 | 24 | 30

export const CHAINS = {
    SOLANA:    1,
    ETHEREUM:  2,
    BSC:       4,
    POLYGON:   5,
    AVALANCHE: 6,
    ARBITRUM:  23,
    OPTIMISM:  24,
    BASE:      30,
} as const

export const CHAIN_MAP = {
    2:  mainnet,
    4:  bsc,
    5:  polygon,
    6:  avalanche,
    23: arbitrum,   
    24: optimism,
    30: base,
} as const

export const COINGECKO_IDS: Record<number, string> = {
    2:  "ethereum",
    4:  "binancecoin",
    5:  "matic-network",
    23: "ethereum",   // Arbitrum uses ETH for gas
    24: "ethereum",   // Optimism uses ETH for gas
    30: "ethereum",   // Base uses ETH for gas
}

export interface JupiterQuote {
    inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    outputMint: "So11111111111111111111111111111111111111112",
    inAmount: "1000000000",
    outAmount: "6756432",  
    priceImpactPct: "0.01"
}