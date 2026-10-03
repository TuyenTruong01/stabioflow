"use client";

import { AppKit } from "@circle-fin/app-kit";
import { createPublicClient, fallback, formatUnits, http } from "viem";
import { readSourceUsdcBalance } from "@/features/move/services/bridge";
import type { SourceChain } from "@/features/move/types";

const SCALE = 18n;
const UNIT = 10n ** SCALE;
const kit = new AppKit();
const rateCache = new Map<string, { expires: number; price?: string }>();

export type NormalizedAsset = { chain: SourceChain; identity: string; rateIdentifier: string; symbol: string; rawBalance: bigint; decimals: number; normalizedAmount: string; usdPrice?: string; usdValue?: string; priceSource?: "appkit" | "coingecko"; priceFetchedAt?: number };
export type NetworkAssets = { chain: SourceChain; assets: NormalizedAsset[] };

function decimalToScaled(value: string): bigint { const [whole, fraction = ""] = value.trim().split("."); if (!/^\d+$/.test(whole) || !/^\d*$/.test(fraction)) throw new Error("Invalid decimal value."); return BigInt(whole) * UNIT + BigInt(fraction.padEnd(18, "0").slice(0, 18) || "0"); }
function scaledToDecimal(value: bigint): string { return formatUnits(value, 18); }
export function normalizeBalance(rawBalance: bigint, decimals: number): string { return formatUnits(rawBalance, decimals); }
export function sumNormalizedAmounts(amounts: readonly string[]): string { return scaledToDecimal(amounts.reduce((total, amount) => total + decimalToScaled(amount), 0n)); }
export type PriceResult = { priceUSD: string; source: "appkit" | "coingecko"; fetchedAt: number };
export function attachUsdValue(asset: NormalizedAsset, price?: PriceResult): NormalizedAsset { if (!price) return asset; try { return { ...asset, usdPrice: price.priceUSD, usdValue: scaledToDecimal(decimalToScaled(asset.normalizedAmount) * decimalToScaled(price.priceUSD) / UNIT), priceSource: price.source, priceFetchedAt: price.fetchedAt }; } catch { return asset; } }
export function sumUsdValues(assets: readonly Pick<NormalizedAsset, "usdValue">[]): string { return scaledToDecimal(assets.reduce((total, asset) => total + (asset.usdValue ? decimalToScaled(asset.usdValue) : 0n), 0n)); }
export function usdValueForAmount(amount: string, usdPrice?: string): string | undefined { if (!usdPrice) return undefined; try { return scaledToDecimal(decimalToScaled(amount) * decimalToScaled(usdPrice) / UNIT); } catch { return undefined; } }

export async function readWalletAssets(chain: SourceChain, address: `0x${string}`): Promise<NetworkAssets> {
  const client = createPublicClient({ transport: fallback(chain.rpcUrls.map((url) => http(url))) });
  const assets: NormalizedAsset[] = [];
  // Arc's official native asset is USDC: it is deliberately represented once.
  if (chain.nativeCurrency) { const rawBalance = await client.getBalance({ address }); assets.push({ chain, identity: "native", rateIdentifier: "NATIVE", symbol: chain.nativeCurrency.symbol, rawBalance, decimals: chain.nativeCurrency.decimals, normalizedAmount: normalizeBalance(rawBalance, chain.nativeCurrency.decimals) }); }
  if (!chain.isArc && chain.usdcAddress) { const rawBalance = await readSourceUsdcBalance(chain, address); assets.push({ chain, identity: chain.usdcAddress, rateIdentifier: chain.usdcAddress, symbol: "USDC", rawBalance, decimals: 6, normalizedAmount: normalizeBalance(rawBalance, 6) }); }
  return { chain, assets };
}

export async function getTokenUsdPrice(chain: SourceChain, tokenIdentifier: string, asset = tokenIdentifier): Promise<PriceResult | undefined> {
  const key = `${chain.name}:${tokenIdentifier}`, cached = rateCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.price ? { priceUSD: cached.price, source: "appkit", fetchedAt: cached.expires - 60_000 } : undefined;
  try { const response = await kit.getTokenRates({ chain: chain.name as never, tokens: [tokenIdentifier] as never }); const entries = response.rates[chain.name] ?? {}; const entry = Object.values(entries)[0] as { priceUSD?: string | number; fetchedAt?: number } | undefined; const price = entry?.priceUSD === undefined ? undefined : String(entry.priceUSD); if (process.env.NODE_ENV === "development") console.table([{ chain: chain.name, asset, identifierSent: tokenIdentifier, rateReturned: price ?? "—" }]); rateCache.set(key, { price, expires: Date.now() + 60_000 }); return price ? { priceUSD: price, source: "appkit", fetchedAt: entry?.fetchedAt ?? Date.now() } : undefined; } catch (error) { if (process.env.NODE_ENV === "development") console.table([{ chain: chain.name, asset, identifierSent: tokenIdentifier, rateReturned: `unavailable: ${error instanceof Error ? error.message : "request failed"}` }]); rateCache.set(key, { expires: Date.now() + 15_000 }); return undefined; }
}

const COINGECKO_IDS: Readonly<Record<string, string>> = { USDC: "usd-coin", ETH: "ethereum", AVAX: "avalanche-2", POL: "polygon-ecosystem-token", INJ: "injective-protocol", SEI: "sei-network", EURC: "eurc" };
const fallbackCache = new Map<string, PriceResult>();
let fallbackExpires = 0;
let fallbackRequest: Promise<void> | undefined;

export async function refreshFallbackPrices(): Promise<void> {
  if (fallbackExpires > Date.now()) return;
  if (fallbackRequest) return fallbackRequest;
  const ids = Object.values(COINGECKO_IDS).join(",");
  fallbackRequest = fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_last_updated_at=true`).then(async (response) => {
    if (!response.ok) throw new Error(`CoinGecko price request failed (${response.status}).`);
    const data = await response.json() as Record<string, { usd?: number; last_updated_at?: number }>;
    const now = Date.now();
    for (const [symbol, id] of Object.entries(COINGECKO_IDS)) { const item = data[id]; if (typeof item?.usd === "number") fallbackCache.set(symbol, { priceUSD: String(item.usd), source: "coingecko", fetchedAt: item.last_updated_at ? item.last_updated_at * 1_000 : now }); }
    fallbackExpires = now + 60_000;
  }).catch((error) => { if (process.env.NODE_ENV === "development") console.debug("[portfolio] CoinGecko fallback unavailable", error); }).finally(() => { fallbackRequest = undefined; });
  return fallbackRequest;
}
export function getFallbackUsdPrice(symbol: string): PriceResult | undefined { return fallbackCache.get(symbol); }
