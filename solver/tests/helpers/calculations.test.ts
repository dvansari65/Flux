import { describe, it, expect } from "vitest";
import { calculateTradingInput, isEvmChain } from "../../src/helpers/calculations";

describe("calculateTradingInput", () => {
    it("deducts exactly 0.5% profit margin from a standard input", () => {
        const input = 1_000_000n;
        const result = calculateTradingInput(input);
        const expectedMargin = (input * 5n) / 1000n;
        expect(result).toBe(input - expectedMargin);
    });

    it("returns 995_000 for an input of 1_000_000 (0.5% = 5_000)", () => {
        expect(calculateTradingInput(1_000_000n)).toBe(995_000n);
    });

    it("returns 0 for a zero input", () => {
        expect(calculateTradingInput(0n)).toBe(0n);
    });

    it("handles very small inputs where margin rounds to zero", () => {
        expect(calculateTradingInput(1n)).toBe(1n);
        expect(calculateTradingInput(100n)).toBe(100n);
        expect(calculateTradingInput(199n)).toBe(199n);
    });

    it("handles very large inputs without overflow", () => {
        const largeInput = 1_000_000_000_000n;
        const result = calculateTradingInput(largeInput);
        const expected = largeInput - (largeInput * 5n) / 1000n;
        expect(result).toBe(expected);
        expect(result).toBeLessThan(largeInput);
    });

    it("trading input is always less than the full input for any non-trivial amount", () => {
        const inputs = [1_000n, 10_000n, 100_000n, 1_000_000_000n];
        for (const input of inputs) {
            expect(calculateTradingInput(input)).toBeLessThan(input);
        }
    });
});

describe("isEvmChain", () => {
    it("returns false for chain ID 1 (Solana)", () => {
        expect(isEvmChain(1)).toBe(false);
    });

    it("returns true for Ethereum (chain ID 2)", () => {
        expect(isEvmChain(2)).toBe(true);
    });

    it("returns true for Arbitrum (chain ID 4)", () => {
        expect(isEvmChain(4)).toBe(true);
    });

    it("returns true for Base (chain ID 5)", () => {
        expect(isEvmChain(5)).toBe(true);
    });

    it("returns true for Polygon (chain ID 6)", () => {
        expect(isEvmChain(6)).toBe(true);
    });

    it("returns true for any arbitrary non-Solana chain ID", () => {
        expect(isEvmChain(99)).toBe(true);
        expect(isEvmChain(1337)).toBe(true);
    });
});
