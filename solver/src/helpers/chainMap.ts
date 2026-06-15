import { arbitrum, avalanche, base, bsc, mainnet, optimism, polygon } from "viem/chains";

export const CHAIN_MAP = {
    2:  mainnet,
    4:  bsc,
    5:  polygon,
    6:  avalanche,
    23: arbitrum,   
    24: optimism,
    30: base,
} as const;
