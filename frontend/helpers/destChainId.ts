import { CHAIN_IDS, ChainOptions } from "@/types/chain";

export const getDestChainID = (chainOptions:ChainOptions)=>{
    return CHAIN_IDS[chainOptions]
}