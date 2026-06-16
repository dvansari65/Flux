import { TOKEN_MINTS, TokenSymbol } from "@intent/shared";


export const tokenMint = (token:TokenSymbol)=>{
    const mint = TOKEN_MINTS[token]
    return mint
}