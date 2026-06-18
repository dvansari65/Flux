import { describe, it, expect, vi, afterEach } from "vitest";
import { getNativeTokenPrice } from "../../src/helpers/getNativeTokenPrice";
import { COINGECKO_IDS } from "@intent/shared";

describe("getNativeTokenPrice", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("fetches and returns the native token price for Ethereum (chain 2)", async () => {
        const chainId = 2;
        const id = COINGECKO_IDS[chainId] as string;
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ [id]: { usd: 3400 } }),
        } as Response);

        const price = await getNativeTokenPrice(chainId);
        expect(price).toBe(3400);
        expect(typeof price).toBe("number");
    });

    it("fetches and returns the native token price for Polygon (chain 5)", async () => {
        const chainId = 5;
        const id = COINGECKO_IDS[chainId] as string;
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ [id]: { usd: 0.85 } }),
        } as Response);

        const price = await getNativeTokenPrice(chainId);
        expect(price).toBe(0.85);
    });

    it("fetches and returns the native token price for BSC (chain 4)", async () => {
        const chainId = 4;
        const id = COINGECKO_IDS[chainId] as string;
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ [id]: { usd: 580 } }),
        } as Response);

        const price = await getNativeTokenPrice(chainId);
        expect(price).toBe(580);
    });

    it("throws for an unsupported chain ID with no CoinGecko mapping", async () => {
        const unsupportedChainId = 9999;
        await expect(getNativeTokenPrice(unsupportedChainId)).rejects.toThrow(
            `No price feed for chain ${unsupportedChainId}`
        );
    });

    it("throws for chain ID 1 (Solana) which has no EVM price feed", async () => {
        await expect(getNativeTokenPrice(1)).rejects.toThrow("No price feed for chain 1");
    });

    it("throws when the network request fails", async () => {
        vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("CoinGecko is down"));
        await expect(getNativeTokenPrice(2)).rejects.toThrow("CoinGecko is down");
    });

    it("throws when the API returns a response with missing token data", async () => {
        const chainId = 2;
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        } as Response);

        await expect(getNativeTokenPrice(chainId)).rejects.toThrow();
    });

    it("resolves successfully for every supported EVM chain ID in COINGECKO_IDS", async () => {
        for (const [chainId, coinGeckoId] of Object.entries(COINGECKO_IDS)) {
            const id = coinGeckoId as string;
            vi.spyOn(global, "fetch").mockResolvedValueOnce({
                ok: true,
                json: async () => ({ [id]: { usd: 100 } }),
            } as Response);

            const price = await getNativeTokenPrice(Number(chainId));
            expect(price).toBe(100);
            vi.restoreAllMocks();
        }
    });

    it("always returns a positive number for a valid chain", async () => {
        const chainId = 2;
        const id = COINGECKO_IDS[chainId] as string;
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ [id]: { usd: 2000 } }),
        } as Response);

        const price = await getNativeTokenPrice(chainId);
        expect(price).toBeGreaterThan(0);
    });
});
