import { createPublicClient, http } from "viem";
import { CHAIN_MAP, type ChainIds } from "../types/chain";


export const chainClient = (chainId:ChainIds)=>{
    if (chainId === 1) return null
    const chain = CHAIN_MAP[chainId]
    return createPublicClient({
        chain,
        transport:http()
    })
}