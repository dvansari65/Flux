import {PublicKey} from "@solana/web3.js"
import BN from "bn.js"


export interface IntentCreated {
    order:PublicKey,
    maker:PublicKey,
    amount:BN
    destinationChain:number,
    nonce:BN,
    outputMint:string,
    minOutputAmount:BN
}

export type OrderStatus =
  | { created: {} }
  | { auctionRunning: {} }
  | { fulfilled: {} }
  | { settled: {} }
  | { cancelled: {} };

  export interface Order {
    /** User who created intent */
    maker: PublicKey;
  
    /** SPL token mint being deposited */
    inputMint: PublicKey;
  
    /** Destination chain token/mint identifier */
    outputMint: string;
  
    /** Amount locked in escrow */
    inputAmount: BN;
  
    /** Minimum acceptable output */
    minOutputAmount: BN;
  
    /** Destination chain identifier */
    destinationChain: number; // u16
  
    /** Recipient on destination chain */
    recipient: string;
  
    /** Unique replay protection */
    nonce: BN; // u64
  
    /** Order expiration */
    deadline: BN; // i64
  
    /** Winning solver (optional initially) */
    solver: PublicKey | null;
  
    /** Current lifecycle state */
    status: OrderStatus;
  
    /** Creation timestamp */
    createdAt: BN; // i64
  
    /** PDA bumps */
    orderBump: number; // u8
    vaultBump: number; // u8
  }