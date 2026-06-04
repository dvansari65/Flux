import { TOKEN_MINTS, TokenOptions } from "@/types/chain";


export const tokenMint = (token:TokenOptions)=>{
    const mint = TOKEN_MINTS[token]
    return mint
}