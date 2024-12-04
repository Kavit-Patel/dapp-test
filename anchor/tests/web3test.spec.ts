import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import {Web3test} from '../target/types/web3test'

describe('web3test', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Web3test as Program<Web3test>

  const web3testKeypair = Keypair.generate()

  it('Initialize Web3test', async () => {
    await program.methods
      .initialize()
      .accounts({
        web3test: web3testKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([web3testKeypair])
      .rpc()

    const currentCount = await program.account.web3test.fetch(web3testKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Web3test', async () => {
    await program.methods.increment().accounts({ web3test: web3testKeypair.publicKey }).rpc()

    const currentCount = await program.account.web3test.fetch(web3testKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Web3test Again', async () => {
    await program.methods.increment().accounts({ web3test: web3testKeypair.publicKey }).rpc()

    const currentCount = await program.account.web3test.fetch(web3testKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Web3test', async () => {
    await program.methods.decrement().accounts({ web3test: web3testKeypair.publicKey }).rpc()

    const currentCount = await program.account.web3test.fetch(web3testKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set web3test value', async () => {
    await program.methods.set(42).accounts({ web3test: web3testKeypair.publicKey }).rpc()

    const currentCount = await program.account.web3test.fetch(web3testKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the web3test account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        web3test: web3testKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.web3test.fetchNullable(web3testKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
