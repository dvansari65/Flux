"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertIntoRawUnits = void 0;
const tokens_1 = require("../types/tokens");
/**
 * Normalizes a human-readable token amount (e.g., 1.5 SOL) into its raw blockchain
 * integer representation (e.g., 1500000000 lamports) based on the token's decimal precision.
 *
 * @param tokenType - The symbol of the token (e.g. "USDC", "SOL")
 * @param input - The human readable amount
 * @returns The raw integer amount, or null if input is invalid
 */
const convertIntoRawUnits = (tokenType, input) => {
    if (!input) {
        return null;
    }
    if (typeof input === "number" && input > 0) {
        return input * Math.pow(10, tokens_1.TOKEN_DECIMALS[tokenType]);
    }
    return null;
};
exports.convertIntoRawUnits = convertIntoRawUnits;
