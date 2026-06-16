import { IdlAccounts, IdlTypes } from "@coral-xyz/anchor";
import { Escrowlayer } from "../idl";
export type { Escrowlayer };
/**
 * The parsed Order state account stored on the Escrowlayer smart contract.
 */
export type Order = IdlAccounts<Escrowlayer>["order"];
/**
 * Enum representing the current fulfillment status of the intent.
 */
export type OrderStatus = IdlTypes<Escrowlayer>["orderStatus"];
/**
 * Arguments passed to the grab_intent instruction by the solver.
 */
export type GrabIntentArgs = IdlTypes<Escrowlayer>["grabIntentArgs"];
/**
 * Event emitted by the Anchor program when a user locks a new cross-chain intent.
 */
export type IntentCreatedEvent = IdlTypes<Escrowlayer>["intentCreated"];
