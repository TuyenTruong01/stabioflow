"use client";

import { AppKit, SwapChain, getTokenDecimals } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { createPublicClient, formatUnits, http } from "viem";
import { ARC_MAINNET } from "@/config/chains";
import type { SwapQuote, SwapResultView, SwapToken } from "@/features/swap/types";

type Eip1193 = NonNullable<Window["ethereum"]>;
type ArcChain = { name: string; chainId?: number; rpcEndpoints: readonly string[] };
const kit = new AppKit();
const erc20BalanceAbi = [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ name: "", type: "uint256" }] }] as const;

function arcSwapChain(): ArcChain {
  const chain = kit.getSupportedChains("swap").find((candidate) => candidate.name === "Arc") as ArcChain | undefined;
  if (!chain?.rpcEndpoints?.[0]) throw new Error("Arc is not currently exposed as a Swap Kit chain.");
  return chain;
}

async function walletAdapter(provider: Eip1193) {
  return createViemAdapterFromProvider({ provider: provider as never });
}

async function tokenContract(token: Exclude<SwapToken, "USDC">): Promise<`0x${string}`> {
  // getTokenRates resolves the public App Kit token alias to the current Arc address.
  // We use its returned registry key rather than embedding a token address in the app.
  const response = await kit.getTokenRates({ chain: "Arc", tokens: [token] });
  const rates = response.rates.Arc ?? {};
  const address = Object.keys(rates).find((key) => /^0x[a-fA-F0-9]{40}$/.test(key));
  if (!address) throw new Error(`${token} is not currently resolvable from the official App Kit configuration.`);
  return address as `0x${string}`;
}

export async function readSwapBalance(provider: Eip1193, address: `0x${string}`, token: SwapToken) {
  if (token === "USDC") {
    const balance = await createPublicClient({ transport: http(ARC_MAINNET.rpcUrl) }).getBalance({ address });
    return { value: balance, decimals: ARC_MAINNET.nativeCurrency.decimals, formatted: formatUnits(balance, ARC_MAINNET.nativeCurrency.decimals) };
  }
  const chain = arcSwapChain();
  const contract = await tokenContract(token);
  const adapter = await walletAdapter(provider);
  const decimals = await getTokenDecimals(contract, chain as never, adapter);
  const value = await createPublicClient({ transport: http(chain.rpcEndpoints[0]) }).readContract({ address: contract, abi: erc20BalanceAbi, functionName: "balanceOf", args: [address] });
  return { value, decimals, formatted: formatUnits(value, decimals) };
}

function params(provider: Eip1193, tokenIn: SwapToken, tokenOut: SwapToken, amountIn: string, slippageBps: number) {
  return walletAdapter(provider).then((adapter) => ({ from: { adapter, chain: "Arc" as SwapChain }, tokenIn, tokenOut, amountIn, config: { slippageBps } }));
}

export async function estimateSwap(provider: Eip1193, tokenIn: SwapToken, tokenOut: SwapToken, amountIn: string, slippageBps: number): Promise<SwapQuote> {
  const estimate = await kit.estimateSwap(await params(provider, tokenIn, tokenOut, amountIn, slippageBps));
  return {
    amountIn: estimate.amountIn,
    estimatedOutput: estimate.estimatedOutput.amount,
    minimumReceived: estimate.stopLimit.amount,
    fees: (estimate.fees ?? []).map((fee) => ({ type: fee.type, token: fee.token, amount: fee.amount })),
  };
}

export async function executeSwap(provider: Eip1193, tokenIn: SwapToken, tokenOut: SwapToken, amountIn: string, slippageBps: number): Promise<SwapResultView> {
  const result = await kit.swap(await params(provider, tokenIn, tokenOut, amountIn, slippageBps));
  return { paid: result.amountIn, received: result.amountOut, txHash: result.txHash, explorerUrl: result.explorerUrl, fees: (result.fees ?? []).map((fee) => ({ type: fee.type, token: fee.token, amount: fee.amount })), status: result.progress.status };
}
