import { describe, it, expect, vi, afterEach } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import type { Connection } from "@solana/web3.js";
import type { Order } from "@intent/shared";

vi.mock("../../src/gas/estimateSolanaDelivery", () => ({
    estimateSolanaDelivery: vi.fn(),
}));

vi.mock("../../src/helpers/getSolPrice", () => ({
    getSolPrice: vi.fn(),
}));

vi.mock("../../src/gas/estimateGas", () => ({
    estimateEthChainsGas: vi.fn(),
}));

vi.mock("../../src/gas/convert", () => ({
    lamportsToUSDC:    vi.fn(),
    convertWeiToUSDC:  vi.fn(),
}));

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const RECIPIENT  = "So11111111111111111111111111111111111111112";

function makeOrder(destinationChain: number): Order {
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

import { estimateSolanaDelivery } from "../../src/gas/estimateSolanaDelivery";
import { getSolPrice } from "../../src/helpers/getSolPrice";
import { estimateEthChainsGas } from "../../src/gas/estimateGas";
import { lamportsToUSDC, convertWeiToUSDC } from "../../src/gas/convert";
import { estimateGas } from "../../src/gas/index";

const mockConnection = {} as Connection;

describe("estimateGas (gas/index.ts router)", () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it("routes to Solana path when destinationChain is 1", async () => {
        vi.mocked(estimateSolanaDelivery).mockResolvedValue({
            estimatedLamports: 1_000_000_000n,
            needsATACreation:  false,
            breakdown:         { baseFee: 5_000n, priorityFee: 0n, rentFee: 0n },
        });
        vi.mocked(getSolPrice).mockResolvedValue(150);
        vi.mocked(lamportsToUSDC).mockResolvedValue(150_000_000n);

        const result = await estimateGas(makeOrder(1), mockConnection);

        expect(estimateSolanaDelivery).toHaveBeenCalled();
        expect(lamportsToUSDC).toHaveBeenCalledWith(1_000_000_000n, 150);
        expect(result).toBe(150_000_000n);
    });

    it("routes to EVM path when destinationChain is 2 (Ethereum)", async () => {
        vi.mocked(estimateEthChainsGas).mockResolvedValue({
            gasUnits:    21_000n,
            gasCostWei:  420_000_000_000_000n,
        });
        vi.mocked(convertWeiToUSDC).mockResolvedValue(1_400_000n);

        const result = await estimateGas(makeOrder(2), mockConnection);

        expect(estimateEthChainsGas).toHaveBeenCalled();
        expect(convertWeiToUSDC).toHaveBeenCalledWith(420_000_000_000_000n, 2);
        expect(result).toBe(1_400_000n);
    });

    it("routes to EVM path for Arbitrum (chain 23)", async () => {
        vi.mocked(estimateEthChainsGas).mockResolvedValue({ gasUnits: 21_000n, gasCostWei: 1_000_000n });
        vi.mocked(convertWeiToUSDC).mockResolvedValue(500_000n);

        const result = await estimateGas(makeOrder(23), mockConnection);

        expect(result).toBe(500_000n);
    });

    it("routes to EVM path for Base (chain 30)", async () => {
        vi.mocked(estimateEthChainsGas).mockResolvedValue({ gasUnits: 21_000n, gasCostWei: 1_000_000n });
        vi.mocked(convertWeiToUSDC).mockResolvedValue(300_000n);

        const result = await estimateGas(makeOrder(30), mockConnection);

        expect(result).toBe(300_000n);
    });

    it("returns undefined for an unknown chain ID that matches no routing branch", async () => {
        const result = await estimateGas(makeOrder(9999), mockConnection);
        expect(result).toBeUndefined();
    });

    it("throws when the Solana delivery estimation rejects", async () => {
        vi.mocked(estimateSolanaDelivery).mockRejectedValue(new Error("Solana RPC error"));

        await expect(estimateGas(makeOrder(1), mockConnection)).rejects.toThrow("Solana RPC error");
    });

    it("throws when the EVM gas estimation rejects", async () => {
        vi.mocked(estimateEthChainsGas).mockRejectedValue(new Error("EVM RPC timeout"));

        await expect(estimateGas(makeOrder(2), mockConnection)).rejects.toThrow("EVM RPC timeout");
    });
});
