import { describe, it, expect, vi, afterEach } from "vitest";
import { getChainClient } from "../../src/helpers/getChainClient";
import { CHAIN_MAP } from "../../src/helpers/chainMap";

vi.mock("viem", async (importOriginal) => {
    const actual = await importOriginal<typeof import("viem")>();
    return {
        ...actual,
        createPublicClient: vi.fn(() => ({ type: "publicClient" })),
    };
});

describe("getChainClient", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns null for chain ID 1 (Solana — not an EVM chain)", () => {
        const result = getChainClient(1);
        expect(result).toBeNull();
    });

    it("returns a viem PublicClient for Ethereum (chain ID 2)", () => {
        const client = getChainClient(2);
        expect(client).not.toBeNull();
        expect(client).toBeDefined();
    });

    it("returns a client for every chain ID present in CHAIN_MAP", () => {
        for (const chainId of Object.keys(CHAIN_MAP).map(Number)) {
            const client = getChainClient(chainId as any);
            expect(client).not.toBeNull();
            expect(client).toBeDefined();
        }
    });

    it("returns a client for Arbitrum (chain ID 23)", () => {
        expect(getChainClient(23)).not.toBeNull();
    });

    it("returns a client for Base (chain ID 30)", () => {
        expect(getChainClient(30)).not.toBeNull();
    });

    it("returns a client for Polygon (chain ID 5)", () => {
        expect(getChainClient(5)).not.toBeNull();
    });

    it("returns a client for Optimism (chain ID 24)", () => {
        expect(getChainClient(24)).not.toBeNull();
    });

    it("returns a client for BSC (chain ID 4)", () => {
        expect(getChainClient(4)).not.toBeNull();
    });

    it("returns a client for Avalanche (chain ID 6)", () => {
        expect(getChainClient(6)).not.toBeNull();
    });
});
