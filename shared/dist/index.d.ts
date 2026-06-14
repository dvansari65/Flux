import { PublicKey } from "@solana/web3.js";
import { IdlAccounts, IdlTypes } from "@coral-xyz/anchor";
import { Escrowlayer } from "./idl";
export type { Escrowlayer };
export type Order = IdlAccounts<Escrowlayer>["order"];
export type OrderStatus = IdlTypes<Escrowlayer>["orderStatus"];
export type GrabIntentArgs = IdlTypes<Escrowlayer>["grabIntentArgs"];
export type IntentCreatedEvent = IdlTypes<Escrowlayer>["intentCreated"];
export type ChainOptions = "Etherium" | "Solana" | "Arbitrum" | "Base" | "Polygon";
export declare const CHAIN_OPTIONS: ChainOptions[];
export type TokenOptions = "USDC" | "ETH" | "SOL" | "USDT" | "WBTC" | "MATIC";
export declare const TOKEN_OPTIONS: TokenOptions[];
export declare const TOKEN_DECIMALS: Record<TokenOptions, number>;
export declare const TOKEN_MINTS: Record<TokenOptions, string>;
export declare const EVM_TOKEN_ADDRESSES: Record<TokenOptions, string>;
export declare const MINT_TO_TOKEN_OPTION: Record<string, TokenOptions>;
export declare const CHAIN_IDS: Record<ChainOptions, number>;
export type ChainIds = 1 | 2 | 4 | 5 | 6 | 23 | 24 | 30;
export declare const CHAINS: {
    readonly SOLANA: 1;
    readonly ETHEREUM: 2;
    readonly BSC: 4;
    readonly POLYGON: 5;
    readonly AVALANCHE: 6;
    readonly ARBITRUM: 23;
    readonly OPTIMISM: 24;
    readonly BASE: 30;
};
export declare const COINGECKO_IDS: Record<number, string>;
export interface JupiterQuote {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    priceImpactPct: string;
}
export declare const convertIntoRawUnits: (tokenType: TokenOptions, input: number | null) => number | null;
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
export interface DbIntentInput {
    sourceChain: ChainOptions;
    destChain: ChainOptions;
    inputToken: TokenOptions;
    outputToken: TokenOptions;
    inputAmount: string;
    minOutputAmount: string;
    senderAddress: string;
    recipientAddr: string;
    deadline: string;
    nonce: string;
    signature: string;
}
