import type { IntentCreatedEvent as IntentCreated } from "@intent/shared";
import { TOKEN_MINTS, EVM_TOKEN_ADDRESSES } from "@intent/shared";
import { 
    estimateGas, 
    handleAuction, 
    getJupiterQuote, 
    evmQuote, 
    resolveEvmToken,
    calculateTradingInput,
    isEvmChain,
    getProgramId, 
    getConnection, 
    getKeypair, 
    getWallet, 
    getProgram, 
    getEventParser 
} from "./lib";

/**
 * Cross-Chain Solver Engine
 * 
 * This module acts as the core bidding engine for the Intent Protocol. It continuously listens to the 
 * Solana blockchain for IntentCreated events. When a new intent is detected, it hydrates the order 
 * data and validates the amounts and deadlines. It then calculates the required gas fees to finalize 
 * the transaction on the destination chain and deducts the protocol's guaranteed profit margin from 
 * the input. Using this trading input, it fetches a live market quote via Jupiter for Solana destinations 
 * or Paraswap for EVM destinations, adjusting for gas fees in the target token. Finally, if the 
 * resulting payout meets or exceeds the user's minimum expected output, it locks in the bid on the 
 * Escrowlayer smart contract.
 */

const programId = getProgramId();
const connection = getConnection();
const keypair = getKeypair();
const wallet = getWallet(keypair);
const program = getProgram(connection, wallet);
const eventParser = getEventParser(programId, program);

connection.onLogs(programId, async (logInfo) => {
    const logs = logInfo.logs;
    if(logInfo.err){
        console.error("RPC Error: Transaction failed or reverted:", logInfo.signature);
        return;
    }
    
    const parsedEvents = Array.from(eventParser.parseLogs(logInfo.logs));
    
    for (const event of parsedEvents) {
        const data = event.data as IntentCreated;
        
        if(event.name === "IntentCreated"){
            console.log(`[EVENT RECEIVED] Intent ID: ${data.order.toBase58()}`);
            
            const orderAccount = await (program.account as any).order.fetch(data.order);
            const minOutputAmount = orderAccount.minOutputAmount;
            const inputAmount = orderAccount.inputAmount;
            
            if(minOutputAmount?.toNumber() <= 0 || inputAmount.toNumber() <= 0 ){
                console.warn("Validation Failed: Input or output amount cannot be zero/negative.");
                return;
            }
            if(!orderAccount.inputMint || !orderAccount.outputMint){
                throw new Error("Validation Failed: Missing routing paths (Input/Output mint).");
            }
            
            const convertedOutputAmount = BigInt(minOutputAmount.toString());
            const convertedInputAmount = BigInt(inputAmount.toString());

            if(orderAccount.deadline.toNumber() > Date.now()){
                console.error("Validation Failed: Order deadline has already expired.");
                return;
            }
            
            const gasFeeUsdc = await estimateGas(orderAccount, connection);

            if (gasFeeUsdc === undefined || gasFeeUsdc === null) {
                console.error("Estimation Failed: Could not fetch destination chain gas fees.");
                return;
            }

            const tradingInput = calculateTradingInput(convertedInputAmount);
            const isEVM = isEvmChain(orderAccount.destinationChain);

            let marketOutputAmount: bigint;
            let gasFeeInOutputToken: bigint = gasFeeUsdc;

            if (!isEVM) {
                marketOutputAmount = await getJupiterQuote(
                    orderAccount.inputMint.toString(),
                    orderAccount.outputMint,
                    Number(tradingInput)
                );

                if (orderAccount.outputMint !== TOKEN_MINTS["USDC"]) {
                    gasFeeInOutputToken = await getJupiterQuote(
                        TOKEN_MINTS["USDC"],
                        orderAccount.outputMint,
                        Number(gasFeeUsdc)
                    );
                }
            } else {
                const inputToken = resolveEvmToken(orderAccount.inputMint.toString());
                const outputToken = resolveEvmToken(orderAccount.outputMint);
                
                marketOutputAmount = await evmQuote(
                    orderAccount.destinationChain,
                    inputToken.address,
                    outputToken.address,
                    tradingInput,
                    inputToken.decimals,
                    outputToken.decimals
                );

                if (outputToken.key !== "USDC") {
                    gasFeeInOutputToken = await evmQuote(
                        orderAccount.destinationChain,
                        EVM_TOKEN_ADDRESSES["USDC"],
                        outputToken.address,
                        gasFeeUsdc,
                        6,
                        outputToken.decimals
                    );
                }
            }

            const maxBidAmount = marketOutputAmount - gasFeeInOutputToken;

            if (maxBidAmount < convertedOutputAmount) {
                console.warn(`[REJECTED] Transaction not profitable. Max Bid: ${maxBidAmount}, Min Required: ${convertedOutputAmount}`);
                return;
            }
            console.log(`[PROFITABLE TRADE FOUND] Submitting bid for: ${maxBidAmount}`);

            const tx = await handleAuction(
                program as any,
                Number(maxBidAmount),
                keypair.publicKey,
                data.order,
                orderAccount.inputMint
            );
            
        }
    }
})
