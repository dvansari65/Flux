import { describe, it, expect, vi, afterEach } from "vitest";
import { lamportsToUSDC, convertWeiToUSDC } from "../../src/gas/convert";
import { COINGECKO_IDS } from "@intent/shared";

describe("lamportsToUSDC", () => {
    it("converts 1 SOL at $150 to 150_000_000 USDC units (6 decimals)", async () => {
        const oneSol = 1_000_000_000n;
        const result = await lamportsToUSDC(oneSol, 150);
        expect(result).toBe(150_000_000n);
    });

    it("converts 0.5 SOL at $200 to 100_000_000 USDC units", async () => {
        const halfSol = 500_000_000n;
        const result = await lamportsToUSDC(halfSol, 200);
        expect(result).toBe(100_000_000n);
    });

    it("converts 0.1 SOL at $200 to 20_000_000 USDC units", async () => {
        const result = await lamportsToUSDC(100_000_000n, 200);
        expect(result).toBe(20_000_000n);
    });

    it("returns 0n for 0 lamports regardless of SOL price", async () => {
        expect(await lamportsToUSDC(0n, 150)).toBe(0n);
        expect(await lamportsToUSDC(0n, 0)).toBe(0n);
    });

    it("rounds up (ceiling) fractional USDC amounts — never rounds down", async () => {
        const tinyLamports = 1000n;
        const result = await lamportsToUSDC(tinyLamports, 150);
        const rawValue = (Number(tinyLamports) / 1e9) * 150 * 1_000_000;
        expect(Number(result)).toBeGreaterThanOrEqual(Math.ceil(rawValue));
    });

    it("scales linearly — doubling lamports doubles USDC output", async () => {
        const base = await lamportsToUSDC(500_000_000n, 100);
        const doubled = await lamportsToUSDC(1_000_000_000n, 100);
        expect(doubled).toBe(base * 2n);
    });

    it("scales linearly — doubling SOL price doubles USDC output", async () => {
        const oneSol = 1_000_000_000n;
        const at100 = await lamportsToUSDC(oneSol, 100);
        const at200 = await lamportsToUSDC(oneSol, 200);
        expect(at200).toBe(at100 * 2n);
    });

    it("handles large gas amounts without precision loss", async () => {
        const largeLamports = 100_000_000_000n;
        const result = await lamportsToUSDC(largeLamports, 200);
        expect(result).toBeGreaterThan(0n);
        expect(typeof result).toBe("bigint");
    });
});

describe("convertWeiToUSDC", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("converts 1 ETH of gas cost at $3400 to correct USDC units", async () => {
        const chainId = 2;
        const id = COINGECKO_IDS[chainId] as string;
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ [id]: { usd: 3400 } }),
        } as Response);

        const oneEthInWei = 1_000_000_000_000_000_000n;
        const result = await convertWeiToUSDC(oneEthInWei, chainId);

        expect(result).toBe(3_400_000_000n);
    });

    it("converts 0.01 ETH of gas at $2000 correctly", async () => {
        const chainId = 2;
        const id = COINGECKO_IDS[chainId] as string;
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ [id]: { usd: 2000 } }),
        } as Response);

        const pointZeroOneEth = 10_000_000_000_000_000n;
        const result = await convertWeiToUSDC(pointZeroOneEth, chainId);

        expect(result).toBe(20_000_000n);
    });

    it("returns 0n for 0 wei gas cost", async () => {
        const chainId = 2;
        const id = COINGECKO_IDS[chainId] as string;
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ [id]: { usd: 3400 } }),
        } as Response);

        const result = await convertWeiToUSDC(0n, chainId);
        expect(result).toBe(0n);
    });

    it("always returns a positive bigint for valid wei and chain inputs", async () => {
        const chainId = 2;
        const id = COINGECKO_IDS[chainId] as string;
        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ [id]: { usd: 3400 } }),
        } as Response);

        const result = await convertWeiToUSDC(21_000n * 50_000_000_000n, chainId);
        expect(typeof result).toBe("bigint");
        expect(result).toBeGreaterThan(0n);
    });

    it("throws when the price feed is unavailable (network failure)", async () => {
        vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("CoinGecko is down"));
        await expect(convertWeiToUSDC(1_000_000_000n, 2)).rejects.toThrow("CoinGecko is down");
    });

    it("throws for an unsupported chain ID with no price feed", async () => {
        await expect(convertWeiToUSDC(1_000_000_000n, 9999)).rejects.toThrow(
            "No price feed for chain 9999"
        );
    });

    it("doubles the USDC output when ETH price doubles, keeping wei constant", async () => {
        const chainId = 2;
        const id = COINGECKO_IDS[chainId] as string;
        const wei = 1_000_000_000_000_000_000n;

        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ [id]: { usd: 1000 } }),
        } as Response);
        const at1000 = await convertWeiToUSDC(wei, chainId);

        vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ [id]: { usd: 2000 } }),
        } as Response);
        const at2000 = await convertWeiToUSDC(wei, chainId);

        expect(at2000).toBe(at1000 * 2n);
    });
});
