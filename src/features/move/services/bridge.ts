"use client";

import { AppKit, BridgeChain } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { createPublicClient, fallback, http } from "viem";
import { SourceChain, type BridgePreview, type BridgeStep } from "@/features/move/types";

const kit = new AppKit();
const erc20BalanceAbi = [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ name: "", type: "uint256" }] }] as const;

type Eip1193 = NonNullable<Window["ethereum"]>;
type SdkChain = { type: string; name: string; chainId?: number; explorerUrl: string; rpcEndpoints: readonly string[]; usdcAddress: string | null; isTestnet: boolean; nativeCurrency?: { symbol?: string; decimals?: number } };

export function bridgeChains(): SourceChain[] {
  const chains = kit.getSupportedChains("bridge", { chainType: "evm", isTestnet: false }) as SdkChain[];
  return chains.filter((chain) => typeof chain.chainId === "number" && chain.rpcEndpoints[0] && (chain.name === "Arc" || chain.usdcAddress)).map((chain) => ({ name: chain.name, chainId: chain.chainId!, explorerUrl: chain.explorerUrl, rpcUrl: chain.rpcEndpoints[0], rpcUrls: chain.rpcEndpoints, usdcAddress: chain.usdcAddress as `0x${string}` | null, isArc: chain.name === "Arc", nativeCurrency: chain.nativeCurrency?.symbol && typeof chain.nativeCurrency.decimals === "number" ? { symbol: chain.nativeCurrency.symbol, decimals: chain.nativeCurrency.decimals } : null }));
}

async function adapter(provider: Eip1193) {
  return createViemAdapterFromProvider({ provider: provider as never });
}

export async function readSourceUsdcBalance(chain: SourceChain, address: `0x${string}`) {
  const client = createPublicClient({ transport: fallback(chain.rpcUrls.map((url) => http(url))) });
  if (chain.isArc) return client.getBalance({ address });
  if (!chain.usdcAddress) throw new Error("The SDK does not provide a USDC contract for this chain.");
  return client.readContract({ address: chain.usdcAddress, abi: erc20BalanceAbi, functionName: "balanceOf", args: [address] });
}

export async function previewBridge(provider: Eip1193, from: SourceChain, to: SourceChain, amount: string): Promise<BridgePreview> {
  const walletAdapter = await adapter(provider);
  const estimate = await kit.estimateBridge({ from: { adapter: walletAdapter, chain: from.name as BridgeChain }, to: { adapter: walletAdapter, chain: to.name as BridgeChain }, amount, token: "USDC" });
  return { fees: estimate.fees.map((fee) => ({ type: fee.type, token: String(fee.token), amount: fee.amount })), gasFees: estimate.gasFees.map((fee) => ({ name: fee.name, token: fee.token, amount: fee.fees?.fee ?? null })), quote: estimate.quote };
}

export async function submitBridge(provider: Eip1193, from: SourceChain, to: SourceChain, amount: string, onStep: (step: BridgeStep) => void) {
  const walletAdapter = await adapter(provider);
  const executionKit = new AppKit();
  executionKit.on("*", (event: unknown) => {
    const value = event as { values?: { name?: string; state?: string; txHash?: string; explorerUrl?: string; error?: { message?: string } }; method?: string };
    if (value.values?.name) onStep({ name: value.values.name, state: value.values.state ?? "pending", txHash: value.values.txHash, explorerUrl: value.values.explorerUrl, error: value.values.error?.message });
  });
  const result = await executionKit.bridge({ from: { adapter: walletAdapter, chain: from.name as BridgeChain }, to: { adapter: walletAdapter, chain: to.name as BridgeChain }, amount, token: "USDC" });
  for (const step of result.steps) onStep({ name: step.name, state: step.state, txHash: step.txHash, explorerUrl: step.explorerUrl, error: step.error instanceof Error ? step.error.message : undefined });
  return result;
}
