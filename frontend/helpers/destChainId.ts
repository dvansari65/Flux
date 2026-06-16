import { CHAIN_IDS, SupportedChain } from "@intent/shared";

export const getDestChainID = (chainOptions:SupportedChain)=>{
    return CHAIN_IDS[chainOptions]
}