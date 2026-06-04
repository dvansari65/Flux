import { Connection , Keypair, PublicKey} from "@solana/web3.js"
import {AnchorProvider, EventParser, Program, Wallet} from "@coral-xyz/anchor"
import idl from "../idl/escrowlayer.json"
import type { IntentCreated } from "./types/intent"
import type {Escrowlayer} from "./types/escrowlayer"
import { estimateGas } from "./gasEstEngine"
import { isProfitable } from "./helpers/checkProfibility"

const programId = new PublicKey("ArswYpDMRf9gP7EExY1pGRaw9Ym18X3fSPkApWAjyZad")
const connection = new Connection("https://api.devnet.solana.com","confirmed")

const keypair = Keypair.generate()
const wallet = new Wallet(keypair)

const provider = new AnchorProvider(connection,wallet,{commitment:"confirmed"})
const program = new Program<Escrowlayer>(idl,provider)

const eventParser = new EventParser(new PublicKey(programId),program.coder)

connection.onLogs(programId,async(logInfo)=>{
    const logs = logInfo.logs;
    if(logInfo.err){
        console.log("Something went wrong:",logInfo.signature);
        return
    }
    const parsedEvents = Array.from(eventParser.parseLogs(logInfo.logs))
    console.log("parsed events:",parsedEvents)
    for (const event of parsedEvents) {
        const data = event.data as IntentCreated
        console.log("data:",data)
        if(event.name === "IntentCreated"){
            const orderAccount = await program.account.order.fetch(data.order);
            const minOutputAmount = orderAccount.minOutputAmount;
            const inputAmount = orderAccount.inputAmount
            
            const convertedOutputAmount = BigInt(minOutputAmount.toString())
            const convertedInputAmount = BigInt(inputAmount.toString())

            if(orderAccount.deadline.toNumber() > Date.now()){
                console.error("Deadline already expired!")
                return;
            }
            let gasFee;
            try {
                gasFee = await estimateGas(orderAccount,connection)
            } catch (error) {
                console.log("error:",error)
                throw error
            }
            // amount 
            if(!gasFee){
                console.log("Gas fees failed to fetch!")
                return
            }
            const profit = convertedInputAmount - gasFee;

            const isProfit = isProfitable(convertedOutputAmount,profit);
            
            if(!isProfit){
                console.warn("Transaction not profitable!!");
                return;
            }

        }
    }
})