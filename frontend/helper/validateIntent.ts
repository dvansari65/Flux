import { PublicKey } from "@solana/web3.js";
import { ChainOptions, TokenOptions } from "@intent/shared";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface IntentValidationParams {
  destChain: ChainOptions;
  recipientAddress: string;
  isWalletConnected: boolean;
  hasSignMessage: boolean;
  inputAmount: number | "";
  minOutputAmount: number | "";
  inputToken: TokenOptions;
  outputToken: TokenOptions;
}

// EVM Address Regex: starts with 0x, followed by 40 hexadecimal characters
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function validateIntentParams(params: IntentValidationParams): ValidationResult {
  // 1. Wallet checks
  if (!params.isWalletConnected) {
    return { isValid: false, error: "Wallet not connected. Please connect your wallet first." };
  }
  if (!params.hasSignMessage) {
    return { isValid: false, error: "Wallet does not support message signing." };
  }

  // 2. Amount checks
  if (typeof params.inputAmount !== "number" || params.inputAmount <= 0) {
    return { isValid: false, error: "Please enter a valid input amount greater than 0." };
  }
  if (typeof params.minOutputAmount !== "number" || params.minOutputAmount <= 0) {
    return { isValid: false, error: "Minimum output amount must be greater than 0." };
  }

  // 3. Recipient Address checks
  const { recipientAddress, destChain } = params;
  if (!recipientAddress || recipientAddress.trim() === "") {
    return { isValid: false, error: "Recipient address cannot be empty." };
  }

  if (destChain === "Solana") {
    if (!isValidSolanaAddress(recipientAddress)) {
      return { isValid: false, error: "Invalid Solana recipient address." };
    }
  } else {
    // For EVM chains (Etherium, Arbitrum, Base, Polygon)
    if (!EVM_ADDRESS_REGEX.test(recipientAddress)) {
      return { isValid: false, error: `Invalid ${destChain} recipient address. Must be a valid 0x hex address.` };
    }
  }

  // 4. Token mismatch or reasonable exchange checks (sanity checks)
  if (params.inputAmount > 1_000_000_000) {
    return { isValid: false, error: "Input amount exceeds maximum allowed limits." };
  }

  return { isValid: true };
}
