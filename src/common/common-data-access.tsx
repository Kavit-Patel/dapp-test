"use client";

import { useCluster } from "@/components/cluster/cluster-data-access";
import { useAnchorProvider } from "@/components/solana/solana-provider";
import { getWeb3testProgram, getWeb3testProgramId } from "@project/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { Cluster } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useCommonProgram() {
  const { publicKey: walletPublicKey } = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getWeb3testProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = getWeb3testProgram(provider);

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  return {
    cluster,
    program,
    programId,
    getProgramAccount,
    walletPublicKey,
  };
}
