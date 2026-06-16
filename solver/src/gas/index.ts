/**
 * Unified Gas Estimation Engine
 * 
 * This module orchestrates gas estimation across both EVM and Solana destinations. It routes the 
 * estimation request to the correct native helper based on the intent's destination chain ID. The 
 * returned native gas cost (ETH, MATIC, SOL, etc.) is then universally normalized into a 6-decimal 
 * USDC value to allow the solver engine to perform predictable profit math.
 */

import type { Connection } from "@solana/web3.js";
import { getSolPrice } from "../helpers";
import type { ChainId, Order } from "@intent/shared";
import { convertWeiToUSDC, lamportsToUSDC } from "./convert";
import { estimateEthChainsGas } from "./estimateGas";
import { estimateSolanaDelivery } from "./estimateSolanaDelivery";


export const estimateGas = async (order: Order, connection: Connection): Promise<bigint | undefined> => {
    const chainId = order.destinationChain as ChainId;

    // Solana destination
    try {
        if (chainId === 1) {
            const { estimatedLamports } = await estimateSolanaDelivery(
                connection,
                Buffer.from(order.recipient),
                Buffer.from(order.outputMint)
            )
            const solPrice = await getSolPrice()
            return lamportsToUSDC(estimatedLamports, solPrice)
        } else if ([2, 4, 5, 6, 23, 24, 30].includes(chainId)) {
            const { gasCostWei } = await estimateEthChainsGas(order)
            return convertWeiToUSDC(gasCostWei, chainId)
        }
    } catch (error) {
        console.log("error:",error)
        throw error
    }

}