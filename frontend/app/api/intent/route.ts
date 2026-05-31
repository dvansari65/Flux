import { prisma } from "@/lib/prisma";
import { DbIntentInput } from "@/types/chain";
import { NextRequest, NextResponse } from "next/server";


export const POST = async (req: NextRequest) => {
    console.log("api hitt...")
    let body;

    try {
        body = await req.json()
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error.message || "failed to parse body!",
                intent: null
            },
            {
                status: 500
            }
        )
    }
    try {

        console.log("body:", body)
        const {
            sourceChain,
            deadline,
            destChain,
            nonce,
            inputAmount,
            inputToken,
            outputToken,
            minOutputAmount,
            recipientAddr,
            signature,
            senderAddress,
        } = body as DbIntentInput
        const missingFields: string[] = [];

        const errors: string[] = [];

        if (typeof sourceChain !== "string")
            errors.push("sourceChain must be a string");

        if (typeof destChain !== "string")
            errors.push("destChain must be a string");

        if (typeof inputToken !== "string")
            errors.push("inputToken must be a string");

        if (typeof outputToken !== "string")
            errors.push("outputToken must be a string");

        if (typeof inputAmount !== "string")
            errors.push("inputAmount must be a string");

        if (typeof minOutputAmount !== "string")
            errors.push("minOutputAmount must be a string");

        if (typeof recipientAddr !== "string")
            errors.push("recipientAddr must be a string");

        if (typeof senderAddress !== "string")
            errors.push("senderAddress must be a string");

        if (typeof signature !== "string")
            errors.push("signature must be a string");

        if (typeof deadline !== "string")
            errors.push("deadline must be a number");

        if (typeof nonce !== "string")
            errors.push("nonce must be a number");

        if (!sourceChain) missingFields.push("sourceChain");
        if (!destChain) missingFields.push("destChain");

        if (!inputToken) missingFields.push("inputToken");
        if (!outputToken) missingFields.push("outputToken");

        if (!inputAmount) missingFields.push("inputAmount");
        if (!minOutputAmount) missingFields.push("minOutputAmount");

        if (!recipientAddr) missingFields.push("recipientAddr");
        if (!signature) missingFields.push("signature");

        if (!senderAddress) missingFields.push("senderAddress");

        if (deadline == null) missingFields.push("deadline");
        if (nonce == null) missingFields.push("nonce");
        if (errors.length > 0) {
            return NextResponse.json(
              {
                intent: null,
                message: "Validation failed",
                errors
              },
              {
                status: 400
              }
            );
          }
        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    intent: null,
                    message: `Missing required fields: ${missingFields.join(", ")}`
                },
                {
                    status: 400
                }
            );
        }
        console.log("sig:", signature.toString())
        const intent = await prisma.intent.create({
            data: {
                sourceChain,
                deadline,
                destinationChain: destChain,
                inputAmount,
                nonce,
                inputToken,
                outputToken,
                minOutputAmount,
                recipient: recipientAddr,
                signature,
                maker: senderAddress
            }
        })
        return NextResponse.json(
            {
                intent,
                message: "Intent created!"
            },
            {
                status: 200
            }
        )
    } catch (error: any) {
        return NextResponse.json(
            {
                intent: null,
                message: error.message || "Server error!"
            },
            {
                status: 500
            }
        )
    }
}