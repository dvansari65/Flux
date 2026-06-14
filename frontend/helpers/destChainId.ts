import { CHAIN_IDS, ChainOptions } from "@intent/shared";

export const getDestChainID = (chainOptions:ChainOptions)=>{
    return CHAIN_IDS[chainOptions]
}