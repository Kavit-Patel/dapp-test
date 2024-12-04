"use client";

import { getWeb3testProgram, getWeb3testProgramId } from "@project/anchor";
import {
  useConnection,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import {
  Cluster,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import {
  createInitializeMintInstruction,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export function useWeb3testProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getWeb3testProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = getWeb3testProgram(provider);

  const accounts = useQuery({
    queryKey: ["web3test", "all", { cluster }],
    queryFn: () => program.account.vestingAccount.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const createMint = async (
    connection: Connection,
    walletAdapter: WalletContextState,
    tokenAmount: string | number | bigint | boolean
  ) => {
    try {
      if (!walletAdapter || !walletAdapter.connected) {
        throw new Error("Wallet not connected. Please connect your wallet.");
      }

      const walletPublicKey = walletAdapter.publicKey;
      if (!walletPublicKey) {
        toast.error("Connect Wallet first !");
        return;
      }
      // Generate a new Keypair for the mint
      const mint = Keypair.generate();
      console.log("Mint PublicKey:", mint.publicKey.toString());

      // Get the associated token account
      // const associatedTokenAccount = await getAssociatedTokenAddress(
      //   mint.publicKey,
      //   walletPublicKey
      // );
      // console.log("Associated Token Account:", associatedTokenAccount.toString());

      // Fetch the recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();

      // Create the transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: walletPublicKey,
      });

      const mintRent = await connection.getMinimumBalanceForRentExemption(
        MINT_SIZE
      );

      const decimals = 9; // Adjust this if you want fewer decimals
      const mintAmount = BigInt(tokenAmount) * BigInt(10 ** decimals); // Adjust for decimals

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: walletPublicKey,
          newAccountPubkey: mint.publicKey,
          lamports: mintRent,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mint.publicKey,
          decimals, // Decimals
          walletPublicKey, // Mint authority
          walletPublicKey // Freeze authority
        )
        // createAssociatedTokenAccountInstruction(
        //   walletPublicKey,
        //   associatedTokenAccount,
        //   walletPublicKey,
        //   mint.publicKey
        // ),
        // createMintToInstruction(
        //   mint.publicKey,
        //   associatedTokenAccount,
        //   walletPublicKey, // Mint authority
        //   mintAmount
        // )
      );

      // Partially sign with the mint keypair
      transaction.partialSign(mint);

      // Send the transaction
      const signature = await walletAdapter.sendTransaction(
        transaction,
        connection,
        {
          skipPreflight: false,
        }
      );
      alert("success");
      console.log(signature);
      return { signature, mint: mint.publicKey };
    } catch (error) {
      console.error("Error creating mint token:", error);
      throw error;
    }
  };

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createMint,
  };
}

export function useWeb3testProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useWeb3testProgram();

  const accountQuery = useQuery({
    queryKey: ["web3test", "fetch", { cluster, account }],
    queryFn: () => program.account.vestingAccount.fetch(account),
  });

  return {
    accountQuery,
  };
}
