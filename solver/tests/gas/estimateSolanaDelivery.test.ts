import { describe, it, expect, vi, afterEach } from "vitest";
import { estimateSolanaDelivery } from "../../src/gas/estimateSolanaDelivery";
import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const RECIPIENT = "So11111111111111111111111111111111111111112";

function makeRecipientBytes(address: string): Uint8Array {
    return new PublicKey(address).toBytes();
}

function makeMintBytes(address: string): Uint8Array {
    return new PublicKey(address).toBytes();
}

function mockConnection(ataExists: boolean, priorityFees: { slot: number; prioritizationFee: number }[]): Connection {
    return {
        getAccountInfo: vi.fn().mockResolvedValue(ataExists ? { lamports: 2_039_280 } : null),
        getRecentPrioritizationFees: vi.fn().mockResolvedValue(priorityFees),
    } as unknown as Connection;
}

describe("estimateSolanaDelivery", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns estimatedLamports, needsATACreation=false when ATA already exists", async () => {
        const connection = mockConnection(true, [
            { slot: 1, prioritizationFee: 1000 },
            { slot: 2, prioritizationFee: 2000 },
        ]);

        const result = await estimateSolanaDelivery(
            connection,
            makeRecipientBytes(RECIPIENT),
            makeMintBytes(USDC_MINT)
        );

        expect(result.needsATACreation).toBe(false);
        expect(result.estimatedLamports).toBeGreaterThan(0n);
        expect(result.breakdown.rentFee).toBe(0n);
        expect(result.breakdown.baseFee).toBe(5_000n);
    });

    it("returns needsATACreation=true and includes rent fee when ATA does not exist", async () => {
        const connection = mockConnection(false, [
            { slot: 1, prioritizationFee: 1000 },
        ]);

        const result = await estimateSolanaDelivery(
            connection,
            makeRecipientBytes(RECIPIENT),
            makeMintBytes(USDC_MINT)
        );

        expect(result.needsATACreation).toBe(true);
        expect(result.breakdown.rentFee).toBe(2_039_280n);
        expect(result.estimatedLamports).toBeGreaterThan(2_039_280n);
    });

    it("includes baseFee of exactly 5_000 lamports in both cases", async () => {
        const withATA = mockConnection(true, [{ slot: 1, prioritizationFee: 1000 }]);
        const withoutATA = mockConnection(false, [{ slot: 1, prioritizationFee: 1000 }]);

        const r1 = await estimateSolanaDelivery(withATA, makeRecipientBytes(RECIPIENT), makeMintBytes(USDC_MINT));
        const r2 = await estimateSolanaDelivery(withoutATA, makeRecipientBytes(RECIPIENT), makeMintBytes(USDC_MINT));

        expect(r1.breakdown.baseFee).toBe(5_000n);
        expect(r2.breakdown.baseFee).toBe(5_000n);
    });

    it("falls back to 1000 microlamports priority fee when no recent fees are available", async () => {
        const connection = mockConnection(true, []);
        const result = await estimateSolanaDelivery(
            connection,
            makeRecipientBytes(RECIPIENT),
            makeMintBytes(USDC_MINT)
        );

        expect(result.estimatedLamports).toBeGreaterThan(0n);
    });

    it("uses higher compute units for ATA creation than plain SPL transfer", async () => {
        const withATA = mockConnection(true, [{ slot: 1, prioritizationFee: 1_000_000 }]);
        const withoutATA = mockConnection(false, [{ slot: 1, prioritizationFee: 1_000_000 }]);

        const plain = await estimateSolanaDelivery(withATA, makeRecipientBytes(RECIPIENT), makeMintBytes(USDC_MINT));
        const create = await estimateSolanaDelivery(withoutATA, makeRecipientBytes(RECIPIENT), makeMintBytes(USDC_MINT));

        expect(create.breakdown.priorityFee).toBeGreaterThan(plain.breakdown.priorityFee);
    });

    it("total equals baseFee + priorityFee + rentFee exactly", async () => {
        const connection = mockConnection(false, [{ slot: 1, prioritizationFee: 5000 }]);
        const result = await estimateSolanaDelivery(
            connection,
            makeRecipientBytes(RECIPIENT),
            makeMintBytes(USDC_MINT)
        );

        const { baseFee, priorityFee, rentFee } = result.breakdown;
        expect(result.estimatedLamports).toBe(baseFee + priorityFee + rentFee);
    });

    it("throws when getRecentPrioritizationFees throws", async () => {
        const connection = {
            getAccountInfo: vi.fn().mockResolvedValue(null),
            getRecentPrioritizationFees: vi.fn().mockRejectedValue(new Error("RPC error")),
        } as unknown as Connection;

        await expect(
            estimateSolanaDelivery(connection, makeRecipientBytes(RECIPIENT), makeMintBytes(USDC_MINT))
        ).rejects.toThrow("RPC error");
    });
});
