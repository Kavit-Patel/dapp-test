// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import Web3testIDL from "../target/idl/vesting.json";
import type { Vesting as Web3test } from "../target/types/vesting";

// Re-export the generated IDL and type
export { Web3test, Web3testIDL };

// The programId is imported from the program IDL.
export const WEB3TEST_PROGRAM_ID = new PublicKey(Web3testIDL.address);

// This is a helper function to get the Web3test Anchor program.
export function getWeb3testProgram(provider: AnchorProvider) {
  return new Program(Web3testIDL as Web3test, provider);
}

// This is a helper function to get the program ID for the Web3test program depending on the cluster.
export function getWeb3testProgramId(cluster: Cluster) {
  switch (cluster) {
    case "devnet":
    case "testnet":
      // This is the program ID for the Web3test program on devnet and testnet.
      return new PublicKey("G7BkPkX43UiUW8gKNouosvNV5j4UqWPL59Pmr3DdngqR");
    case "mainnet-beta":
    default:
      return WEB3TEST_PROGRAM_ID;
  }
}
