/**
 * Auction Bidding Execution
 * 
 * This module handles the final on-chain execution of a profitable intent. Once the solver has 
 * determined that an order is profitable after routing and gas fees, this function invokes the 
 * Escrowlayer smart contract's placeBid instruction. It locks in the solver's commitment to fulfill 
 * the order at the calculated bid price.
 */

import type { Program } from "@coral-xyz/anchor"
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system"
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token"
import {  type PublicKey } from "@solana/web3.js"
import { BN } from "bn.js"


export const handleAuction = async (
    program:Program,
    bidPrice:number,
    solverKey:PublicKey,
    order:PublicKey,
    expectedMint:PublicKey
)=>{
    try {
        
        const tx = await (program.methods as any)
                .placeBid(new BN(bidPrice))
                .accounts({
                    maker:solverKey,
                    order,
                    inputMint:expectedMint,
                    tokenProgram:TOKEN_PROGRAM_ID,
                    SystemProgram:SYSTEM_PROGRAM_ID
                })
                .rpc()
        return tx
    } catch (error) {
        console.error("ERROR:",error)
    }
}