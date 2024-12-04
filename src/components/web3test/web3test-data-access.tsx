'use client'

import {getWeb3testProgram, getWeb3testProgramId} from '@project/anchor'
import {useConnection} from '@solana/wallet-adapter-react'
import {Cluster, Keypair, PublicKey} from '@solana/web3.js'
import {useMutation, useQuery} from '@tanstack/react-query'
import {useMemo} from 'react'
import toast from 'react-hot-toast'
import {useCluster} from '../cluster/cluster-data-access'
import {useAnchorProvider} from '../solana/solana-provider'
import {useTransactionToast} from '../ui/ui-layout'

export function useWeb3testProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getWeb3testProgramId(cluster.network as Cluster), [cluster])
  const program = getWeb3testProgram(provider)

  const accounts = useQuery({
    queryKey: ['web3test', 'all', { cluster }],
    queryFn: () => program.account.web3test.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['web3test', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ web3test: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useWeb3testProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useWeb3testProgram()

  const accountQuery = useQuery({
    queryKey: ['web3test', 'fetch', { cluster, account }],
    queryFn: () => program.account.web3test.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['web3test', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ web3test: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['web3test', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ web3test: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['web3test', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ web3test: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['web3test', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ web3test: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
