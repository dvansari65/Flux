"use client"

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/escrowlayer.json"
import {Escrowlayer} from "../types/escrowlayer"
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useMemo } from "react";

export const useProgram = ()=>{
    const { connection } = useConnection();
    const wallet = useWallet();
  
    const provider = useMemo(() => {
      if (!wallet.wallet) return null;
  
      return new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );
    }, [connection, wallet]);
  
    const program = useMemo(() => {
      if (!provider) return null;
  
      return new Program<Escrowlayer>(
        idl as Escrowlayer,
        provider
      );
    }, [provider]);
   
  
    return { program, provider };
}