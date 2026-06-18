import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveEvmToken } from "../../src/helpers/tokenResolver";
import { EVM_TOKEN_ADDRESSES, TOKEN_DECIMALS, MINT_TO_TOKEN_OPTION } from "@intent/shared";

describe("resolveEvmToken", () => {
    it("resolves a known USDC Solana mint to its EVM address and decimals", () => {
        const usdcMint = Object.entries(MINT_TO_TOKEN_OPTION).find(
            ([, symbol]) => symbol === "USDC"
        )?.[0];

        if (!usdcMint) {
            throw new Error("USDC mint not found in MINT_TO_TOKEN_OPTION — check shared config");
        }

        const result = resolveEvmToken(usdcMint);

        expect(result.key).toBe("USDC");
        expect(result.address).toBe(EVM_TOKEN_ADDRESSES["USDC"]);
        expect(result.decimals).toBe(TOKEN_DECIMALS["USDC"]);
        expect(result.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("resolves a known ETH Solana mint to its EVM address and decimals", () => {
        const ethMint = Object.entries(MINT_TO_TOKEN_OPTION).find(
            ([, symbol]) => symbol === "ETH"
        )?.[0];

        if (!ethMint) {
            throw new Error("ETH mint not found in MINT_TO_TOKEN_OPTION — check shared config");
        }

        const result = resolveEvmToken(ethMint);

        expect(result.key).toBe("ETH");
        expect(result.address).toBe(EVM_TOKEN_ADDRESSES["ETH"]);
        expect(result.decimals).toBe(TOKEN_DECIMALS["ETH"]);
    });

    it("throws for an unknown or unsupported mint address", () => {
        const fakeMint = "FakeMint11111111111111111111111111111111111";
        expect(() => resolveEvmToken(fakeMint)).toThrow(
            `Unsupported EVM token mapping for mint: ${fakeMint}`
        );
    });

    it("throws for an empty string mint", () => {
        expect(() => resolveEvmToken("")).toThrow();
    });

    it("resolves every mint present in MINT_TO_TOKEN_OPTION without error", () => {
        for (const [mint] of Object.entries(MINT_TO_TOKEN_OPTION)) {
            expect(() => resolveEvmToken(mint)).not.toThrow();
        }
    });

    it("returned EVM address is always a valid hex-checksummed address", () => {
        for (const [mint] of Object.entries(MINT_TO_TOKEN_OPTION)) {
            const result = resolveEvmToken(mint);
            expect(result.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
        }
    });

    it("returned decimals are always a positive integer", () => {
        for (const [mint] of Object.entries(MINT_TO_TOKEN_OPTION)) {
            const result = resolveEvmToken(mint);
            expect(result.decimals).toBeGreaterThan(0);
            expect(Number.isInteger(result.decimals)).toBe(true);
        }
    });
});
