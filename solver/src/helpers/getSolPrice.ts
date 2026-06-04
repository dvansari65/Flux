import { Price, PriceServiceConnection } from "@pythnetwork/price-service-client"

// SOL/USD price feed ID on Pyth
const SOL_USD_FEED = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
// helpers/price/index.ts

export async function getSolPrice(): Promise<number> {
    try {
        // try Jupiter first — fastest, most accurate for Solana
        return await getJupiterPrice()
    } catch {
        console.warn("Jupiter price failed, falling back to CoinGecko")
        try {
            return await getCoinGeckoPrice()
        } catch {
            throw new Error("All price feeds failed")
        }
    }
}

async function getJupiterPrice(): Promise<number> {
    try {
        const SOL_MINT = "So11111111111111111111111111111111111111112"
        const res = await fetch(`https://api.jup.ag/price/v2?ids=${SOL_MINT}`)
        if (!res.ok) throw new Error("Jupiter API failed")
        const data = await res.json()
        return data.data[SOL_MINT].price
    } catch (error) {
        throw error
    }
}

async function getCoinGeckoPrice(): Promise<number> {
    try {
        const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        )
        if (!res.ok) throw new Error("CoinGecko API failed")
        const data = await res.json()
        return data.solana.usd
    } catch (error) {
        throw error
    }
}
// also get any token price by mint
export async function getTokenPriceByMint(mint: string): Promise<number> {
    try {
        const res = await fetch(
            `https://api.jup.ag/price/v2?ids=${mint}`
        )
        const data = await res.json()
        return data.data[mint].price
    } catch (error) {
        console.log("error:", error)
        throw error
    }
}