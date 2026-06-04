import { encodeFunctionData, parseAbi } from "viem";
import { chainClient } from "../helpers/giveChainClient";
import type { ChainIds } from "../types/chain";
import type { Order } from "../types/intent";
import { estimateSolanaDelivery } from "./estimateGasSolana";
import type { Connection } from "@solana/web3.js";
import { lamportsToUSDC } from "./convert";
import { getSolPrice } from "../helpers/getSolPrice";

const DUMMY_EVM_ADDRESS = "0x0000000000000000000000000000000000000001" as const;
const ERC20_ABI = parseAbi([
    "function transfer(address to, uint256 amount) returns (bool)"
])

export const estimateEthChainsGas = async (order:Order)=>{
    try {
        const chainId = order.destinationChain as ChainIds
        const client = chainClient(chainId);
        if (!client) throw new Error(`No client for chain ${chainId}`)
    
        const recipientBytes = order.recipient.slice(12);
        const recipient = `0x${Buffer.from(recipientBytes).toString("hex")}` as `0x${string}`;
    
        const outputMintBytes = order.outputMint.slice(12);
        const outputMint = `0x${Buffer.from(outputMintBytes).toString("hex")}` as `0x${string}`
    
        const callData = encodeFunctionData({
            abi:ERC20_ABI,
            functionName:"transfer",
            args:[recipient,BigInt(order.minOutputAmount.toString())]
        })
        
        const gasUnits = await client.estimateGas({
            account:DUMMY_EVM_ADDRESS,
            to:outputMint,
            data:callData
        })
    
        const {gasPrice,maxFeePerGas} = await client.estimateFeesPerGas()
    
        const gasCostWei = gasUnits * ( maxFeePerGas ?? gasPrice ?? 0n)
     
        return {gasUnits,gasCostWei}
    } catch (error) {
        console.log("error:",error);
        throw error
    }
}

export const estimateSolanaGas = async(order:Order,connection:Connection)=>{
    
  try {
      const { estimatedLamports } = await estimateSolanaDelivery(
          connection,
          Buffer.from(order.recipient),
          Buffer.from(order.outputMint)
      )
      const solPrice = await getSolPrice()
      return lamportsToUSDC(estimatedLamports, solPrice)
  } catch (error) {
    console.log("error:",error);
    throw error
  }
}