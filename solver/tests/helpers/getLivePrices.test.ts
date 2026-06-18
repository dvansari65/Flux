import { describe, it, expect, vi, afterEach } from "vitest";
import { getJupiterQuote, evmQuote } from "../../src/helpers/getLivePrices";

describe("getJupiterQuote", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns a bigint representing the output amount from the Jupiter API", async () => {
        const mockOutAmount = "2500000";
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ outAmount: mockOutAmount }),
        } as Response);

        const result = await getJupiterQuote(
            "So11111111111111111111111111111111111111112",
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            1_000_000
        );

        expect(result).toBe(BigInt(mockOutAmount));
        expect(typeof result).toBe("bigint");
    });

    it("throws when the API returns a response without outAmount", async () => {
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ error: "Route not found" }),
        } as Response);

        await expect(
            getJupiterQuote("FAKE_MINT", "FAKE_MINT_OUT", 1_000)
        ).rejects.toThrow();
    });

    it("throws when the API returns an empty object", async () => {
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        } as Response);

        await expect(
            getJupiterQuote("ANY_MINT", "ANY_MINT_OUT", 1_000)
        ).rejects.toThrow("Failed to fetch Jupiter quote");
    });

    it("throws when the network request itself fails", async () => {
        vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));

        await expect(
            getJupiterQuote("ANY_MINT", "ANY_MINT_OUT", 1_000)
        ).rejects.toThrow("Network error");
    });

    it("correctly converts a string outAmount to bigint without precision loss", async () => {
        const largeAmount = "999999999999999999";
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ outAmount: largeAmount }),
        } as Response);

        const result = await getJupiterQuote("INPUT", "OUTPUT", 1_000_000);
        expect(result).toBe(BigInt(largeAmount));
    });
});

describe("evmQuote", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns a bigint representing the destAmount from the Paraswap API", async () => {
        const mockDestAmount = "3800000000000000000";
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                priceRoute: { destAmount: mockDestAmount },
            }),
        } as Response);

        const result = await evmQuote(
            1,
            "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            1_000_000n,
            6,
            18
        );

        expect(result).toBe(BigInt(mockDestAmount));
        expect(typeof result).toBe("bigint");
    });

    it("throws when the Paraswap response has no priceRoute", async () => {
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ error: "Token pair not supported" }),
        } as Response);

        await expect(
            evmQuote(1, "0xSRC", "0xDEST", 1_000_000n, 6, 18)
        ).rejects.toThrow("Failed to fetch Paraswap quote");
    });

    it("throws when priceRoute exists but destAmount is missing", async () => {
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ priceRoute: {} }),
        } as Response);

        await expect(
            evmQuote(1, "0xSRC", "0xDEST", 1_000_000n, 6, 18)
        ).rejects.toThrow();
    });

    it("throws when the network request itself fails", async () => {
        vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Connection refused"));

        await expect(
            evmQuote(1, "0xSRC", "0xDEST", 1_000_000n, 6, 18)
        ).rejects.toThrow("Connection refused");
    });

    it("correctly converts a large destAmount string to bigint without precision loss", async () => {
        const largeAmount = "123456789012345678901234567890";
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                priceRoute: { destAmount: largeAmount },
            }),
        } as Response);

        const result = await evmQuote(1, "0xSRC", "0xDEST", 1_000_000n, 6, 18);
        expect(result).toBe(BigInt(largeAmount));
    });
});
