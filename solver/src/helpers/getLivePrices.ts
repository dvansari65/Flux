/**
 * Liquidity Routing & Aggregation
 * 
 * This module connects to decentralized liquidity aggregators (Jupiter on Solana, Paraswap on EVM). 
 * It is responsible for querying the deepest liquidity pools in real-time to find the best possible 
 * exchange rate for the requested intent. The solver uses these exact quotes to determine if fulfilling 
 * the user's order is currently profitable.
 */

export const getJupiterQuote = async (
    inputMint: string,
    outputMint: string,
    inputAmount: number
): Promise<bigint> => {
    try {
        const res = await fetch(
            `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${inputAmount}&slippageBps=50`
        );
        const data = await res.json();
        
        if (!data || !data.outAmount) {
            throw new Error(`Failed to fetch Jupiter quote for ${inputMint} -> ${outputMint}`);
        }
        
        // outAmount is how much output token you actually get at market rate (in target decimals)
        return BigInt(data.outAmount);
    } catch (error) {
        console.error("Jupiter Quote ERROR:", error);
        throw error;
    }
}

export const evmQuote = async (
    network: number,
    srcToken: string,
    destToken: string,
    amountWei: bigint,
    srcDecimals: number,
    destDecimals: number
): Promise<bigint> => {
    try {
        const url = `https://apiv5.paraswap.io/prices?srcToken=${srcToken}&destToken=${destToken}&amount=${amountWei.toString()}&srcDecimals=${srcDecimals}&destDecimals=${destDecimals}&side=SELL&network=${network}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data || !data.priceRoute || !data.priceRoute.destAmount) {
            throw new Error(`Failed to fetch Paraswap quote for ${srcToken} -> ${destToken} on network ${network}`);
        }
        
        return BigInt(data.priceRoute.destAmount);
    } catch (error) {
        console.error("Paraswap Quote ERROR:", error);
        throw error;
    }
}