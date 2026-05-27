type ChainOptions = "Ethereum" | "Solana" | "Arbitrum" | "Base" | "Polygon"
type TokenOptions = "USDC" | "ETH" | "SOL" | "USDT" | "WBTC" | "MATIC"

interface CrossChainSwapIntent {
  // Chain info
  sourceChain: ChainOptions        // where funds are coming FROM
  destinationChain: ChainOptions   // where funds are going TO

  // Token info
  inputToken: TokenOptions         // token user is sending
  outputToken: TokenOptions        // token user wants to receive

  // Amounts
  inputAmount: number              // exact amount user is sending
  minOutputAmount: number          // minimum they're willing to receive (slippage protection)

  // Addresses
  senderAddress: string            // user's wallet on source chain
  recipientAddress: string         // user's wallet on destination chain (could be different)

  // Intent protection
  nonce: number                    // replay attack protection
  deadline: number                 // unix timestamp — intent expires after this
}