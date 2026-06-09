# Flux - Intent-Based Cross-Chain Payment Protocol

Flux is an intent-based cross-chain payment protocol that enables fast, seamless, and user-friendly cross-chain asset transfers. Instead of manually bridging assets, users simply declare their *intent* to transfer funds, and a network of competitive Solvers fulfills this intent on the destination chain for a small fee.

## Architecture & System Flow

The protocol operates through a competitive auction mechanism ensuring the user gets the best possible rate. Here is the complete system flow:

1. **User Creates Intent**: A user interacts with the frontend, fills out the transfer form, and signs the transaction.
2. **Funds Locked in Escrow**: The user's tokens (e.g., USDC) are locked in a Vault Program Derived Address (PDA) on the source chain (Solana).
3. **IntentCreated Event**: An `IntentCreated` event is emitted on-chain.
4. **Solver Auction**: Off-chain Solvers listen for this event and calculate their bids. For example, if the intent is for 1000 USDC, Solvers might bid 997, 998, and 995 USDC to be delivered on the destination chain.
5. **Auction Closes**: The auction runs for a short duration (e.g., 3 seconds). The highest bid (e.g., 998 USDC) wins the right to fulfill the intent.
6. **Winner Verification**: Solvers verify if they won the auction by checking if their public key matches the selected solver for the order.
7. **Delivery on Destination Chain**: The winning Solver uses their own liquidity to deliver the agreed amount (998 USDC) to the recipient on the destination chain.
8. **Proof Submission**: The winning Solver submits cryptographic proof of the delivery (e.g., destination transaction hash or Wormhole VAA) back to the Solana escrow.
9. **Escrow Release**: Upon verifying the proof, the escrow releases the originally locked funds (1000 USDC) to the winning Solver.
10. **Order Settled**: The Solver claims the original funds, capturing the spread as profit (e.g., 2 USDC), and the user's intent is successfully fulfilled.

## Tech Stack

- **Solana**: The core settlement and escrow layer. Hosts the Vault PDA and handles event emission, auction settlement, proof verification, and final fund release.
- **USDC**: The primary asset used for intent transfers and solver bids.
- **Wormhole (VAA)**: Used for cross-chain messaging and providing verifiable proof of delivery on the destination chain back to Solana.
- **Solvers**: Off-chain infrastructure (bots) that monitor intents, participate in auctions, and execute transactions on destination chains using their own liquidity.
- **Frontend**: The user interface for creating intents and interacting with the protocol.

## Project Structure

- `escrowlayer/`: Smart contracts for the Solana Vault PDA, auction mechanism, and escrow logic.
- `solver/`: Off-chain bot infrastructure for monitoring events, calculating bids, and fulfilling intents across chains.
- `frontend/`: User interface for end-users to create intents and monitor their cross-chain transfers.
