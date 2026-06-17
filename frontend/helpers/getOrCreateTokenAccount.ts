import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from "@solana/spl-token"
import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { SendTransactionOptions } from "@solana/wallet-adapter-base"
import { VersionedTransaction } from "@solana/web3.js"

type SendTransaction = (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: SendTransactionOptions
) => Promise<string>

export async function getOrCreateMakerTokenAccount(
    connection: Connection,
    maker: PublicKey,
    mint: PublicKey,
    sendTransaction: SendTransaction
): Promise<PublicKey> {
    const ata = await getAssociatedTokenAddress(mint, maker)

    try {
        await getAccount(connection, ata)
        return ata
    } catch {
        const ix = createAssociatedTokenAccountInstruction(
            maker,
            ata,
            maker,
            mint
        )

        const tx = new Transaction().add(ix)
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = maker

        const signature = await sendTransaction(tx, connection)

        await connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            "confirmed"
        )

        return ata
    }
}