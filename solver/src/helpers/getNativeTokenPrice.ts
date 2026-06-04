import { COINGECKO_IDS } from "../types/chain"


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