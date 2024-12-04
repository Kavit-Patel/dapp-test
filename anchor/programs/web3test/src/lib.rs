#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ");

#[program]
pub mod web3test {
    use super::*;

  pub fn close(_ctx: Context<CloseWeb3test>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.web3test.count = ctx.accounts.web3test.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.web3test.count = ctx.accounts.web3test.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeWeb3test>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.web3test.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeWeb3test<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Web3test::INIT_SPACE,
  payer = payer
  )]
  pub web3test: Account<'info, Web3test>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseWeb3test<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub web3test: Account<'info, Web3test>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub web3test: Account<'info, Web3test>,
}

#[account]
#[derive(InitSpace)]
pub struct Web3test {
  count: u8,
}
