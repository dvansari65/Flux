/**
 * Network RPC Client Generator
 * 
 * This helper dynamically generates viem RPC clients based on the requested chain ID. It utilizes 
 * the internal chain map to route requests to the correct public or private RPC endpoints for EVM 
 * compatible chains, allowing the solver to read state or estimate gas on any supported destination.
 */

import { createPublicClient, http } from "viem";
import { type ChainId } from "@intent/shared";
import { CHAIN_MAP } from "./chainMap";


export const getChainClient = (chainId: ChainId)=>{
    if (chainId === 1) return null
    const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP]
    return createPublicClient({
        chain,
        transport:http()
    })
}