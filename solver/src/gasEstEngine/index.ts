import type { Connection } from "@solana/web3.js";
import { getSolPrice } from "../helpers/getSolPrice";
import type { ChainIds } from "../types/chain";
import type { Order } from "../types/intent";
import { convertWeiToUSDC, lamportsToUSDC } from "./convert";
import { estimateEthChainsGas } from "./estimateGas";
import { estimateSolanaDelivery } from "./estimateGasSolana";


export const estimateGas = async (order: Order, connection: Connection): Promise<bigint | undefined> => {
    const chain = order.destinationChain

    // Solana destination
    try {
        if (chain === 1) {
            const { estimatedLamports } = await estimateSolanaDelivery(
                connection,
                Buffer.from(order.recipient),
                Buffer.from(order.outputMint)
            )
            const solPrice = await getSolPrice()
            return lamportsToUSDC(estimatedLamports, solPrice)
        }
    
        // EVM destination
        if ([2, 4, 5, 6, 23, 24, 30].includes(chain)) {
            const { gasCostWei } = await estimateEthChainsGas(order)
            return convertWeiToUSDC(gasCostWei, chain)
        }
    } catch (error) {
        console.log("error:",error)
        throw error
    }

}