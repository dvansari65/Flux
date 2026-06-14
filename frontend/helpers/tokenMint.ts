import { TOKEN_MINTS, TokenOptions } from "@intent/shared";


export const tokenMint = (token:TokenOptions)=>{
    const mint = TOKEN_MINTS[token]
    return mint
}