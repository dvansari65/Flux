import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getNativeTokenPrice } from "../helpers/getNativeTokenPrice"

// gas/convert.ts
export async function lamportsToUSDC(
    lamports: bigint,
    solPriceUSD: number
): Promise<bigint> {
    // lamports → SOL → USD → USDC (6 decimals)
    const solAmount = Number(lamports) / LAMPORTS_PER_SOL
    const usdValue = solAmount * solPriceUSD
    return BigInt(Math.ceil(usdValue * 1_000_000))  // USDC has 6 decimals
}

// wei is in 18 decimals (ETH/ARB/BASE/OP all use ETH as gas token)
// USDC is 6 decimals
// formula: (wei / 1e18) * ethPriceUSD * 1e6

export async function convertWeiToUSDC(
    gasCostWei: bigint,
    chainId: number
): Promise<bigint> {
    const nativePrice = await getNativeTokenPrice(chainId)
    
    // convert wei to ETH first
    const gasCostEth = Number(gasCostWei) / 1e18
    
    // convert ETH to USD
    const gasCostUSD = gasCostEth * nativePrice
    
    // convert USD to USDC units (6 decimals)
    const gasCostUSDC = BigInt(Math.ceil(gasCostUSD * 1_000_000))

    console.log({
        gasCostWei: gasCostWei.toString(),
        gasCostEth,
        gasCostUSD,
        gasCostUSDC: gasCostUSDC.toString(),
        nativePrice,
        chainId
    })

    return gasCostUSDC
}