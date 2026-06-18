import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import type { Order } from "@intent/shared";

vi.mock("../../src/helpers/getChainClient", () => ({
    getChainClient: vi.fn(),
}));

vi.mock("../../src/gas/estimateSolanaDelivery", () => ({
    estimateSolanaDelivery: vi.fn(),
}));

vi.mock("../../src/helpers/getSolPrice", () => ({
    getSolPrice: vi.fn(),
}));

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const RECIPIENT  = "So11111111111111111111111111111111111111112";

function makeOrder(destinationChain = 2): Order {
    return {
        destinationChain,
        recipient:       new PublicKey(RECIPIENT).toBytes(),
        outputMint:      new PublicKey(USDC_MINT).toBytes(),
        inputMint:       new PublicKey(USDC_MINT).toBytes(),
        inputAmount:     new BN(1_000_000),
        minOutputAmount: new BN(990_000),
        deadline:        new BN(Math.floor(Date.now() / 1000) + 3600),
        nonce:           new BN(Date.now()),
    } as unknown as Order;
}

import { getChainClient } from "../../src/helpers/getChainClient";
import { estimateSolanaDelivery } from "../../src/gas/estimateSolanaDelivery";
import { getSolPrice } from "../../src/helpers/getSolPrice";
import { estimateEthChainsGas, estimateSolanaGas } from "../../src/gas/estimateGas";

describe("estimateEthChainsGas", () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it("returns gasUnits and gasCostWei when maxFeePerGas is available", async () => {
        const mockClient = {
            estimateGas:       vi.fn().mockResolvedValue(21_000n),
            estimateFeesPerGas: vi.fn().mockResolvedValue({
                maxFeePerGas: 20_000_000_000n,
                gasPrice:     10_000_000_000n,
            }),
        };
        vi.mocked(getChainClient).mockReturnValue(mockClient as any);

        const result = await estimateEthChainsGas(makeOrder(2));

        expect(result.gasUnits).toBe(21_000n);
        expect(result.gasCostWei).toBe(21_000n * 20_000_000_000n);
    });

    it("falls back to gasPrice when maxFeePerGas is null", async () => {
        const mockClient = {
            estimateGas:       vi.fn().mockResolvedValue(21_000n),
            estimateFeesPerGas: vi.fn().mockResolvedValue({
                maxFeePerGas: null,
                gasPrice:     5_000_000_000n,
            }),
        };
        vi.mocked(getChainClient).mockReturnValue(mockClient as any);

        const result = await estimateEthChainsGas(makeOrder(2));

        expect(result.gasCostWei).toBe(21_000n * 5_000_000_000n);
    });

    it("throws when getChainClient returns null", async () => {
        vi.mocked(getChainClient).mockReturnValue(null);

        await expect(estimateEthChainsGas(makeOrder(1))).rejects.toThrow(
            "No client for chain 1"
        );
    });

    it("throws when client.estimateGas rejects", async () => {
        const mockClient = {
            estimateGas:       vi.fn().mockRejectedValue(new Error("RPC timeout")),
            estimateFeesPerGas: vi.fn().mockResolvedValue({ maxFeePerGas: 10n }),
        };
        vi.mocked(getChainClient).mockReturnValue(mockClient as any);

        await expect(estimateEthChainsGas(makeOrder(2))).rejects.toThrow("RPC timeout");
    });

    it("throws when client.estimateFeesPerGas rejects", async () => {
        const mockClient = {
            estimateGas:       vi.fn().mockResolvedValue(21_000n),
            estimateFeesPerGas: vi.fn().mockRejectedValue(new Error("Fee estimation failed")),
        };
        vi.mocked(getChainClient).mockReturnValue(mockClient as any);

        await expect(estimateEthChainsGas(makeOrder(2))).rejects.toThrow("Fee estimation failed");
    });
});

describe("estimateSolanaGas", () => {
    const mockConnection = {} as Connection;

    afterEach(() => {
        vi.resetAllMocks();
    });

    it("returns correct USDC-normalized gas cost from lamports and SOL price", async () => {
        vi.mocked(estimateSolanaDelivery).mockResolvedValue({
            estimatedLamports: 1_000_000_000n,
            needsATACreation:  false,
            breakdown:         { baseFee: 5_000n, priorityFee: 0n, rentFee: 0n },
        });
        vi.mocked(getSolPrice).mockResolvedValue(150);

        const result = await estimateSolanaGas(makeOrder(1), mockConnection);

        expect(result).toBe(150_000_000n);
    });

    it("uses the SOL price returned by getSolPrice for the conversion", async () => {
        vi.mocked(estimateSolanaDelivery).mockResolvedValue({
            estimatedLamports: 2_000_000_000n,
            needsATACreation:  false,
            breakdown:         { baseFee: 5_000n, priorityFee: 0n, rentFee: 0n },
        });
        vi.mocked(getSolPrice).mockResolvedValue(200);

        const result = await estimateSolanaGas(makeOrder(1), mockConnection);

        expect(result).toBe(400_000_000n);
    });

    it("throws when estimateSolanaDelivery rejects", async () => {
        vi.mocked(estimateSolanaDelivery).mockRejectedValue(new Error("Solana RPC error"));

        await expect(
            estimateSolanaGas(makeOrder(1), mockConnection)
        ).rejects.toThrow("Solana RPC error");
    });

    it("throws when getSolPrice rejects", async () => {
        vi.mocked(estimateSolanaDelivery).mockResolvedValue({
            estimatedLamports: 1_000_000n,
            needsATACreation:  false,
            breakdown:         { baseFee: 5_000n, priorityFee: 0n, rentFee: 0n },
        });
        vi.mocked(getSolPrice).mockRejectedValue(new Error("All price feeds failed"));

        await expect(
            estimateSolanaGas(makeOrder(1), mockConnection)
        ).rejects.toThrow("All price feeds failed");
    });
});
