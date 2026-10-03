"use client";
import { AppKit, EarnChain } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
type Provider = NonNullable<Window["ethereum"]>;
const kit = new AppKit();
async function from(provider: Provider) { return { adapter: await createViemAdapterFromProvider({ provider: provider as never }), chain: "Arc" as EarnChain }; }
export async function getOpportunities() { return (await kit.earn.exploreVaults({ chain: "Arc" as EarnChain, sortBy: "apy" })).vaults; }
export async function getPosition(provider: Provider, vaultAddress: string) { return kit.earn.getPosition({ from: await from(provider), vaultAddress }); }
export async function previewDeposit(provider: Provider, vaultAddress: string, amount: string) { return kit.earn.getDepositQuote({ from: await from(provider), vaultAddress, amount }); }
export async function previewWithdraw(provider: Provider, vaultAddress: string, amount: string) { return kit.earn.getWithdrawalQuote({ from: await from(provider), vaultAddress, amount }); }
export async function deposit(provider: Provider, vaultAddress: string, amount: string) { return kit.earn.deposit({ from: await from(provider), vaultAddress, amount }); }
export async function withdraw(provider: Provider, vaultAddress: string, amount: string) { return kit.earn.withdraw({ from: await from(provider), vaultAddress, amount }); }
