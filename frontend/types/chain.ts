import { PublicKey } from "@solana/web3.js";

export type ChainOptions = "Etherium" | "Solana" | "Arbitrum" | "Base" | "Polygon"

export const CHAIN_OPTIONS: ChainOptions[] = ["Etherium", "Solana", "Arbitrum", "Base", "Polygon"]

export type TokenOptions = "USDC" | "ETH" | "SOL" | "USDT" | "WBTC" | "MATIC"

export const TOKEN_OPTIONS: TokenOptions[] = ["USDC", "ETH", "SOL", "USDT", "WBTC", "MATIC"]

export const TOKEN_DECIMALS = {
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
}

export const convertIntoRawUnits = (tokenType:TokenOptions,input:number | null)=>{
  if(!input){
    return null
  }
  if(tokenType == "ETH" && typeof input === "number" && input > 0){
    return (input * TOKEN_DECIMALS.ETH)
  }
  if(tokenType == "SOL" && typeof input === "number" && input > 0){
    return (input * TOKEN_DECIMALS.SOL)
  }
  if(tokenType == "USDC" && typeof input === "number" && input > 0){
    return (input * TOKEN_DECIMALS.USDC)
  }
  if(tokenType == "USDT" && typeof input === "number" && input > 0){
    return (input * TOKEN_DECIMALS.USDT)
  }
  if(tokenType == "WBTC" && typeof input === "number" && input > 0){
    return (input * TOKEN_DECIMALS.WBTC)
  }
  if(tokenType == "MATIC" && typeof input === "number" && input > 0){
    return (input * TOKEN_DECIMALS.MATIC)
  }
}

interface CrossChainSwapIntent {
  // Chain info
  sourceChain: ChainOptions        // where funds are coming FROM
  destinationChain: ChainOptions   // where funds are going TO

  // Token info
  inputToken: TokenOptions         // token user is sending
  outputToken: TokenOptions        // token user wants to receive

  // Amounts
  inputAmount: number              // exact amount user is sending
  minOutputAmount: number          // minimum they're willing to receive (slippage protection)

  // Addresses
  senderAddress: string            // user's wallet on source chain
  recipientAddress: string         // user's wallet on destination chain (could be different)

  // Intent protection
  nonce: number                    // replay attack protection
  deadline: number                 // unix timestamp — intent expires after this
}

export const CHAIN_IDS: Record<ChainOptions, number> = {
  Solana:   1,
  Etherium: 2,
  Arbitrum: 23,
  Base:     30,
  Polygon:  5,
}

export interface IntentArgs{
  inputMint:typeof TOKEN_MINTS[TokenOptions],
  outputMint:typeof TOKEN_MINTS[TokenOptions],
  inputAmount:number,
  minOutputAmount:number,
  destinationChain: typeof CHAIN_IDS[ChainOptions],
  recipient:PublicKey,
  deadline:number,
  nonce:number
}

export interface Intent {
  sourceChain: ChainOptions;
  destChain: ChainOptions;

  inputToken: TokenOptions;
  outputToken: TokenOptions;

  // Raw units
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

  // Raw units
  inputAmount: string;
  minOutputAmount: string;

  senderAddress: string;
  recipientAddr: string;

  deadline: string;
  nonce: string;
  signature:string
}