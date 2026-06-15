/**
 * Universal Native Token Price Oracle
 * 
 * This module fetches the live spot price of various EVM native gas tokens (ETH, MATIC, BNB, etc.) 
 * using the Pyth Network. It dynamically maps the requested chain ID to the corresponding Pyth 
 * price feed ID, allowing the solver to accurately calculate gas delivery costs for any supported 
 * destination network.
 */

import { COINGECKO_IDS } from "@intent/shared";


export const getNativeTokenPrice = async(chainId:number)=>{
    try {
        const id = COINGECKO_IDS[chainId]
        if(!id){
            throw new Error(`No price feed for chain ${chainId}`)
        }
        const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
        )
        const data = await res.json()
        console.log("data from get native token price:",data)
        return data[id].usd

    } catch (error) {
        throw error
    }
}