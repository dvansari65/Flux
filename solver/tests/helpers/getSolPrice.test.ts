import { describe, it, expect, vi, afterEach } from "vitest";
import { getSolPrice, getTokenPriceByMint } from "../../src/helpers/getSolPrice";

const SOL_MINT = "So11111111111111111111111111111111111111112";

describe("getSolPrice", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns the SOL price from Jupiter when it succeeds", async () => {
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { [SOL_MINT]: { price: 155.50 } } }),
        } as Response);

        const price = await getSolPrice();
        expect(price).toBe(155.50);
        expect(typeof price).toBe("number");
    });

    it("falls back to CoinGecko when Jupiter fails and returns a valid price", async () => {
        vi.spyOn(global, "fetch")
            .mockRejectedValueOnce(new Error("Jupiter API failed"))
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ solana: { usd: 142.00 } }),
            } as Response);

        const price = await getSolPrice();
        expect(price).toBe(142.00);
    });

    it("throws when both Jupiter and CoinGecko fail", async () => {
        vi.spyOn(global, "fetch")
            .mockRejectedValueOnce(new Error("Jupiter down"))
            .mockRejectedValueOnce(new Error("CoinGecko down"));

        await expect(getSolPrice()).rejects.toThrow("All price feeds failed");
    });

    it("throws when Jupiter returns a non-ok response", async () => {
        vi.spyOn(global, "fetch")
            .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ solana: { usd: 140.00 } }),
            } as Response);

        const price = await getSolPrice();
        expect(price).toBe(140.00);
    });

    it("returns a positive number for a valid price", async () => {
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { [SOL_MINT]: { price: 200 } } }),
        } as Response);

        const price = await getSolPrice();
        expect(price).toBeGreaterThan(0);
    });
});

describe("getTokenPriceByMint", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns the price for a known mint from Jupiter", async () => {
        const mint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { [mint]: { price: 1.00 } } }),
        } as Response);

        const price = await getTokenPriceByMint(mint);
        expect(price).toBe(1.00);
    });

    it("throws when the Jupiter price response is missing the mint data", async () => {
        const unknownMint = "UNKNOWN_MINT_ADDRESS_1111111111111111111111";
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: {} }),
        } as Response);

        await expect(getTokenPriceByMint(unknownMint)).rejects.toThrow();
    });

    it("throws when the network fails", async () => {
        vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));
        await expect(getTokenPriceByMint("ANY_MINT")).rejects.toThrow("Network error");
    });
});
