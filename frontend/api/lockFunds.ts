import { getOrCreateMakerTokenAccount } from "@/helpers/getOrCreateTokenAccount"
import { useProgram } from "@/hooks/useProgram"
import { IntentArgs } from "@/types/chain"
import { Escrowlayer } from "@/types/escrowlayer"
import { MethodsNamespace } from "@coral-xyz/anchor"
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useMutation } from "@tanstack/react-query"
import { BN } from "bn.js"

export const useLockFunds = () => {
    const { program } = useProgram()
    const { publicKey, sendTransaction } = useWallet()
    const { connection } = useConnection()
    return useMutation({
        mutationKey: ["lock"],
        mutationFn: async ({
            inputAmount,
            inputMint,
            outputMint,
            minOutputAmount,
            recipient,
            deadline,
            destinationChain,
            nonce
        }: IntentArgs) => {
            try {
                if (!publicKey) {
                    throw new Error("Please connect your wallet!")
                }
                if (!program) {
                    return;
                }
                const nonceBuffer = Buffer.alloc(8);
                nonceBuffer.writeBigInt64LE(BigInt(nonce))
                const [orderPda] = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("order"),
                        publicKey.toBuffer(),
                        nonceBuffer
                    ],
                    program?.programId
                )
                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("vault"),
                        publicKey.toBuffer(),
                        nonceBuffer
                    ],
                    program.programId
                )
                const makerTokenAccount = await getOrCreateMakerTokenAccount(
                    connection,
                    publicKey,
                    new PublicKey(inputMint),
                    sendTransaction
                )
                const tx = await (program?.methods as any)
                    .grabIntent({
                        inputMint: new PublicKey(inputMint),
                        outputMint,
                        inputAmount: new BN(inputAmount),
                        minOutputAmount: new BN(minOutputAmount),
                        destinationChain,
                        recipient,
                        deadline: new BN(deadline),
                        nonce: new BN(nonce)
                    })
                    .accounts({
                        maker: publicKey,
                        order: orderPda,
                        vault: vaultPda,
                        makerTokenAccount,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SYSTEM_PROGRAM_ID
                    })
                    .rpc()
                return tx
            } catch (error) {
                console.log("ERROR", error)
                throw error
            }
        }
    })
}