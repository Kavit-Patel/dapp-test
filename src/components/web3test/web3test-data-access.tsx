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
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
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

      const mint = Keypair.generate();
      console.log("Mint PublicKey:", mint.publicKey.toString());

      const { blockhash } = await connection.getLatestBlockhash();

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
      );
      alert("works perfect till now ");

      transaction.partialSign(mint);
      if (!walletAdapter.signTransaction) {
        alert("Wallet adapter doesn't support signing transaction");
        throw new Error(
          "The wallet adapter does not support signing transactions."
        );
      }
      const signedTransaction = await walletAdapter.signTransaction(
        transaction
      );
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
        }
      );

      // const signature = await walletAdapter.sendTransaction(
      //   transaction,
      //   connection,
      //   {
      //     skipPreflight: false,
      //   }
      // );
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

export const useCreateMintAndTokenAccount = () => {
  const createMintAndTokenAccount = useMutation<
    { signature: string; mint: PublicKey; associatedTokenAccount: PublicKey },
    Error,
    {
      connection: Connection;
      walletAdapter: WalletContextState;
      tokenAmount: number | bigint | string;
    }
  >({
    mutationKey: ["mintToken", "create"],
    mutationFn: async ({ connection, walletAdapter, tokenAmount }) => {
      if (!walletAdapter || !walletAdapter.connected) {
        throw new Error("Wallet not connected. Please connect your wallet.");
      }

      const walletPublicKey = walletAdapter.publicKey;
      if (!walletPublicKey) {
        throw new Error("Wallet public key not available.");
      }

      const mint = Keypair.generate();
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mint.publicKey,
        walletPublicKey
      );

      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: walletPublicKey,
      });

      const mintRent = await connection.getMinimumBalanceForRentExemption(
        MINT_SIZE
      );
      const decimals = 9;
      const mintAmount = BigInt(tokenAmount) * BigInt(10 ** decimals);

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
          decimals,
          walletPublicKey,
          walletPublicKey
        ),
        createAssociatedTokenAccountInstruction(
          walletPublicKey,
          associatedTokenAccount,
          walletPublicKey,
          mint.publicKey
        ),
        createMintToInstruction(
          mint.publicKey,
          associatedTokenAccount,
          walletPublicKey,
          mintAmount
        )
      );

      transaction.partialSign(mint);

      if (!walletAdapter.signTransaction) {
        alert("Wallet adapter doesn't support signing transaction");
        throw new Error(
          "The wallet adapter does not support signing transactions."
        );
      }
      const signedTransaction = await walletAdapter.signTransaction(
        transaction
      );
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
        }
      );
      // const signature = await walletAdapter.sendTransaction(
      //   transaction,
      //   connection,
      //   {
      //     skipPreflight: false,
      //     signers: [mint], // Added mint keypair as an external signer
      //   }
      // );

      return { signature, mint: mint.publicKey, associatedTokenAccount };
    },
    onSuccess: ({ signature, mint, associatedTokenAccount }) => {
      toast.success(`Token created successfully! Signature: ${signature}`);
      console.log("Mint PublicKey:", mint.toBase58());
      console.log(
        "Associated Token Account:",
        associatedTokenAccount.toBase58()
      );
      alert(associatedTokenAccount.toBase58());
    },
    onError: (error) => {
      console.error("Error creating mint token:", error);
      toast.error(`Failed to create mint token: ${error.message}`);
    },
  });
  return { createMintAndTokenAccount };
};

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
