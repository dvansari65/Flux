/**
 * System Initialization and Dependency Injection
 * 
 * This module is responsible for bootstrapping the Solana connection, the solver's keypair, and the 
 * Anchor program instance. It abstracts the boilerplate setup required to interact with the 
 * Escrowlayer smart contract, providing clean getter functions so the main execution loop remains 
 * free of setup logic.
 */

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, EventParser, Program, Wallet } from "@coral-xyz/anchor";
import type { Escrowlayer } from "@intent/shared";
import idl from "../idl/escrowlayer.json";

export const getProgramId = (): PublicKey => {
    return new PublicKey("ArswYpDMRf9gP7EExY1pGRaw9Ym18X3fSPkApWAjyZad");
};

export const getConnection = (): Connection => {
    return new Connection("https://api.devnet.solana.com", "confirmed");
};

export const getKeypair = (): Keypair => {
    // In production, load this from a secure .env variable
    return Keypair.generate();
};

export const getWallet = (keypair: Keypair): Wallet => {
    return new Wallet(keypair);
};

export const getProgram = (connection: Connection, wallet: Wallet): Program<Escrowlayer> => {
    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    return new Program<Escrowlayer>(idl as unknown as Escrowlayer, provider);
};

export const getEventParser = (programId: PublicKey, program: Program<Escrowlayer>): EventParser => {
    return new EventParser(programId, program.coder);
};
