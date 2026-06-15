import { PublicKey } from "@solana/web3.js";
import { IdlAccounts, IdlTypes } from "@coral-xyz/anchor";
import { Escrowlayer } from "./idl";
export type { Escrowlayer };

// --- Anchor IDL Types ---
export type Order = IdlAccounts<Escrowlayer>["order"];
export type OrderStatus = IdlTypes<Escrowlayer>["orderStatus"];
export type GrabIntentArgs = IdlTypes<Escrowlayer>["grabIntentArgs"];
export type IntentCreatedEvent = IdlTypes<Escrowlayer>["intentCreated"];

// --- Domain Types ---
export type ChainOptions = "Etherium" | "Solana" | "Arbitrum" | "Base" | "Polygon";

export const CHAIN_OPTIONS: ChainOptions[] = ["Etherium", "Solana", "Arbitrum", "Base", "Polygon"];

export type TokenOptions = "USDC" | "ETH" | "SOL" | "USDT" | "WBTC" | "MATIC";

export const TOKEN_OPTIONS: TokenOptions[] = ["USDC", "ETH", "SOL", "USDT", "WBTC", "MATIC"];

export const TOKEN_DECIMALS: Record<TokenOptions, number> = {
  USDC: 6,
  USDT: 6,
  SOL: 9,
  ETH: 18,
  WBTC: 8,
  MATIC: 18
};

export const TOKEN_MINTS: Record<TokenOptions, string> = {
  USDC:  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT:  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  SOL:   "So11111111111111111111111111111111111111112",   // Wrapped SOL
  ETH:   "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",  // Wormhole ETH
  WBTC:  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",  // Wormhole WBTC
  MATIC: "Gz7VkD4MacbEB6yC5XD3HcumEiYx2EtDYYrfikGsvopG",  // Wormhole MATIC
};

// Native Ethereum (Chain 1) Contract Addresses for Paraswap
export const EVM_TOKEN_ADDRESSES: Record<TokenOptions, string> = {
  USDC:  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  USDT:  "0xdac17f958d2ee523a2206206994597c13d831ec7",
  SOL:   "0xd31a59c85ae9d8edefec411d448f90841571b89c",   // wSOL on ETH
  ETH:   "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",  // Native ETH placeholder
  WBTC:  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  MATIC: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
};

export const MINT_TO_TOKEN_OPTION: Record<string, TokenOptions> = Object.entries(TOKEN_MINTS).reduce((acc, [key, value]) => {
  acc[value] = key as TokenOptions;
  return acc;
}, {} as Record<string, TokenOptions>);

export const CHAIN_IDS: Record<ChainOptions, number> = {
  Solana:   1,
  Etherium: 2,
  Arbitrum: 23,
  Base:     30,
  Polygon:  5,
};

export type ChainIds = 1 | 2 | 4 | 5 | 6 | 23 | 24 | 30;

export const CHAINS = {
    SOLANA:    1,
    ETHEREUM:  2,
    BSC:       4,
    POLYGON:   5,
    AVALANCHE: 6,
    ARBITRUM:  23,
    OPTIMISM:  24,
    BASE:      30,
} as const;

export const COINGECKO_IDS: Record<number, string> = {
    2:  "ethereum",
    4:  "binancecoin",
    5:  "matic-network",
    23: "ethereum",   
    24: "ethereum",   
    30: "ethereum",   
};

export interface JupiterQuote {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    priceImpactPct: string;
}

// --- Utilities ---
export const convertIntoRawUnits = (tokenType: TokenOptions, input: number | null): number | null => {
  if (!input) {
    return null;
  }
  if (typeof input === "number" && input > 0) {
    return input * Math.pow(10, TOKEN_DECIMALS[tokenType]);
  }
  return null;
};

// --- Custom Intent Types ---
export interface IntentArgs {
  inputMint: typeof TOKEN_MINTS[TokenOptions];
  outputMint: typeof TOKEN_MINTS[TokenOptions];
  inputAmount: number;
  minOutputAmount: number;
  destinationChain: typeof CHAIN_IDS[ChainOptions];
  recipient: PublicKey;
  deadline: number;
  nonce: number;
}

export interface Intent {
  sourceChain: ChainOptions;
  destChain: ChainOptions;
  inputToken: TokenOptions;
  outputToken: TokenOptions;
  inputAmount: string;
  minOutputAmount: string;
  senderAddress: string;
  recipientAddr: string;
  deadline: number;
  nonce: number;
}
