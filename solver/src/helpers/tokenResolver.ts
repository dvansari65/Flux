/**
 * Cross-Chain Token Directory
 * 
 * This utility abstracts the mapping of Solana-based Wormhole mints to their native EVM equivalents. 
 * By reading from the centralized workspace registries, it dynamically returns the exact hex address 
 * and decimal precision required to execute swaps or gas estimations on the destination network.
 */

import { EVM_TOKEN_ADDRESSES, MINT_TO_TOKEN_OPTION, TOKEN_DECIMALS } from "@intent/shared";

export const resolveEvmToken = (mintString: string) => {
    const tokenKey = MINT_TO_TOKEN_OPTION[mintString] as keyof typeof EVM_TOKEN_ADDRESSES;
    
    if (!tokenKey || !EVM_TOKEN_ADDRESSES[tokenKey]) {
        throw new Error(`Unsupported EVM token mapping for mint: ${mintString}`);
    }

    return {
        key: tokenKey,
        address: EVM_TOKEN_ADDRESSES[tokenKey],
        decimals: TOKEN_DECIMALS[tokenKey]
    };
};
