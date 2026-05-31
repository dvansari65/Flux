import { DbIntentInput } from "@/types/chain"
import { useMutation } from "@tanstack/react-query"


export const useCreateIntent = () => {
    return useMutation({
        mutationKey: ["intent"],
        mutationFn: async ({
            sourceChain,
            destChain,
            inputToken,
            outputToken,
            minOutputAmount,
            inputAmount,
            senderAddress,
            signature,
            nonce,
            recipientAddr,deadline
        }: DbIntentInput) => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/intent`, {
                    method: "POST",
                    body: JSON.stringify({
                        sourceChain,
                        destChain,
                        inputToken,
                        outputToken,
                        minOutputAmount,
                        inputAmount,
                        senderAddress,
                        signature,
                        nonce,
                        recipientAddr,
                        deadline
                    })
                })
                const data = await res.json();
                console.log("data:", data)
                if (!res.ok) {
                    throw new Error(data.message || "Failed to create intent!")
                }
                return data
            } catch (error) {
                console.log("error:", error)
                throw new Error(error instanceof Error ? error.message : "Something went wrong!")
            }
        }
    })
}