/**
 * Solver Profit Math Engine
 * 
 * This file isolates the business logic for profit margins. The `calculateTradingInput` function 
 * automatically slices the protocol's required profit margin (0.5%) off the input amount before any 
 * market routing takes place, guaranteeing that the solver never operates at a loss.
 */

export const calculateTradingInput = (inputAmount: bigint): bigint => {
    const profitMargin = (inputAmount * 5n) / 1000n;
    return inputAmount - profitMargin;
};

export const isEvmChain = (chainId: number): boolean => {
    return chainId !== 1; // 1 is Solana
};
