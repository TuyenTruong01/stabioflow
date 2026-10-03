"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@/components/Wallet/WalletProvider";
import { ARC_MAINNET } from "@/config/chains";
import { getOpportunities, getPosition } from "@/features/earn/services/earn";
import { bridgeChains } from "@/features/move/services/bridge";
import {
  attachUsdValue,
  getFallbackUsdPrice,
  getTokenUsdPrice,
  readWalletAssets,
  refreshFallbackPrices,
  sumNormalizedAmounts,
  sumUsdValues,
  usdValueForAmount,
  type NetworkAssets,
} from "@/features/portfolio/services/portfolio";
import "./portfolio.css";
import "./portfolio-actions.css";
import "./portfolio-summary.css";
import "./portfolio-fades.css";
import "./portfolio-workflows.css";
import "./portfolio-network-cards.css";
import "./portfolio-hero.css";
import "./portfolio-hierarchy.css";

type Chain = ReturnType<typeof bridgeChains>[number];
type ChainState = { chain: Chain; loading: boolean; unavailable: boolean; assets: NetworkAssets["assets"] };
type EarnState = { loading: boolean; unavailable: boolean; positions: number; value?: string; priceMissing: boolean };

const chainLogo: Record<string, string> = {
  Arc: "/images/chains/arc.png",
  Ethereum: "/images/chains/ethereum.png",
  Arbitrum: "/images/chains/arbitrum.png",
  Polygon: "/images/chains/polygon.png",
  Optimism: "/images/chains/optimism.png",
  Base: "/images/chains/base.png",
  Linea: "/images/chains/linea.png",
  Avalanche: "/images/chains/avalanche.png",
  Sei: "/images/chains/sei.png",
  Injective: "/images/chains/injective.png",
  Ink: "/images/chains/ink.png",
  Morpho: "/images/chains/morpho.png",
  Pharos: "/images/chains/pharos.png",
};

const fmtAmount = (value?: string) => !value || value === "0" ? "0.0000" : Number(value) < 0.00005 ? "<0.0001" : Number(value).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const fmtUsd = (value?: string) => value === undefined ? "$ —" : `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function NetworkMark({ chain }: { chain: Chain }) {
  const source = chainLogo[chain.name];
  if (source) return <Image className="chain-logo" src={source} width={24} height={24} alt="" />;
  return <span className="chain-logo chain-logo-fallback" aria-hidden="true">{chain.isArc ? "A" : chain.name.slice(0, 1)}</span>;
}

function WorkflowCard({ href, icon, title, description, action, tone }: { href: string; icon: string; title: string; description: string; action: string; tone: "blue" | "violet" | "teal" | "indigo" }) {
  return <Link href={href} className={`dashboard-workflow dashboard-workflow-${tone}`}>
    <span className="workflow-icon" aria-hidden="true">{icon}</span>
    <span className="workflow-copy"><strong>{title}</strong><small>{description}</small></span>
    <span className="workflow-action">{action} <b aria-hidden="true">→</b></span>
  </Link>;
}

export function PortfolioDashboard() {
  const { address, chainId, provider } = useWallet();
  const [networks, setNetworks] = useState<ChainState[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [earn, setEarn] = useState<EarnState>({ loading: false, unavailable: false, positions: 0, priceMissing: false });

  const loadWallet = useCallback(async () => {
    if (!address) return;
    const chains = bridgeChains();
    const fallbackReady = refreshFallbackPrices();
    setNetworks(chains.map((chain) => ({ chain, loading: true, unavailable: false, assets: [] })));
    await Promise.all(chains.map(async (chain) => {
      try {
        const result = await readWalletAssets(chain, address as `0x${string}`);
        const assets = await Promise.all(result.assets.map(async (asset) => {
          const appKit = await getTokenUsdPrice(chain, asset.rateIdentifier, asset.symbol);
          if (appKit) return attachUsdValue(asset, appKit);
          await fallbackReady;
          return attachUsdValue(asset, getFallbackUsdPrice(asset.symbol));
        }));
        setNetworks((current) => current.map((row) => row.chain.chainId === chain.chainId ? { ...row, loading: false, assets } : row));
      } catch {
        setNetworks((current) => current.map((row) => row.chain.chainId === chain.chainId ? { ...row, loading: false, unavailable: true } : row));
      }
    }));
  }, [address]);

  const loadEarn = useCallback(async () => {
    if (!address || !provider || chainId !== ARC_MAINNET.id) return;
    setEarn({ loading: true, unavailable: false, positions: 0, priceMissing: false });
    try {
      const vaults = await getOpportunities();
      const settled = await Promise.allSettled(vaults.filter((vault) => vault.asset === "USDC").map((vault) => getPosition(provider, vault.vaultAddress)));
      const positions = settled.filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof getPosition>>> => result.status === "fulfilled").map((result) => result.value);
      if (positions.length === 0 && settled.length > 0) throw new Error("Earn positions could not be read.");
      const balances = positions.map((position) => String(position.currentBalance ?? "0")).filter((balance) => !/^0(?:\.0+)?$/.test(balance));
      const arc = bridgeChains().find((chain) => chain.isArc);
      const appKitRate = arc ? await getTokenUsdPrice(arc, "NATIVE", "USDC") : undefined;
      await refreshFallbackPrices();
      const rate = appKitRate ?? getFallbackUsdPrice("USDC");
      const value = usdValueForAmount(sumNormalizedAmounts(balances), rate?.priceUSD);
      setEarn({ loading: false, unavailable: false, positions: balances.length, value, priceMissing: balances.length > 0 && !rate });
    } catch {
      setEarn({ loading: false, unavailable: true, positions: 0, priceMissing: false });
    }
  }, [address, chainId, provider]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadWallet(); void loadEarn(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWallet, loadEarn]);

  const totals = useMemo(() => {
    const assets = networks.flatMap((row) => row.assets);
    const pricedNonZero = assets.filter((asset) => asset.rawBalance > 0n && asset.usdValue);
    const wallet = sumUsdValues(assets);
    const missing = assets.filter((asset) => asset.rawBalance > 0n && !asset.usdValue).length + (earn.priceMissing ? 1 : 0);
    const hasValuation = pricedNonZero.length > 0 || earn.value !== undefined;
    return { wallet, total: hasValuation ? sumNormalizedAmounts([wallet, earn.value ?? "0"]) : undefined, missing, unavailable: networks.filter((row) => row.unavailable).length };
  }, [networks, earn]);

  const allocation = useMemo(() => {
    const total = totals.total === undefined ? NaN : Number(totals.total);
    const wallet = Number(totals.wallet);
    const earnValue = Number(earn.value ?? "0");
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(wallet) || !Number.isFinite(earnValue)) return undefined;
    const walletPercent = Math.max(0, Math.min(100, wallet / total * 100));
    const earnPercent = Math.max(0, Math.min(100, earnValue / total * 100));
    return { walletPercent, earnPercent };
  }, [earn.value, totals]);

  const shown = (showAll ? networks : networks.filter((row) => row.chain.isArc || row.unavailable || row.assets.some((asset) => asset.rawBalance > 0n))).toSorted((left, right) => {
    if (left.chain.isArc) return -1;
    if (right.chain.isArc) return 1;
    return Number(sumUsdValues(right.assets)) - Number(sumUsdValues(left.assets));
  });

  return <section className="portfolio dashboard-portfolio">
    <section className="dashboard-hero" aria-labelledby="dashboard-title">
      <div className="dashboard-hero-copy">
        <p className="eyebrow">Move. Earn. Swap. Flows.</p>
        <h1 id="dashboard-title">Put your <span>stablecoins</span> to work.</h1>
        <p>View supported wallet assets, then move, earn, or swap when you are ready.</p>
      </div>
      <Image className="dashboard-hero-art" src="/images/dashboard/stabio-dashboard-hero-wide.png" width={2560} height={360} sizes="(max-width: 1280px) 100vw, 1236px" alt="" preload />
    </section>

    {!address ? <section className="card portfolio-empty dashboard-empty">
      <p className="eyebrow">Your assets</p>
      <h2>Connect your wallet to see your live portfolio.</h2>
      <p className="muted">Balances and supported networks appear here after connection. Stabio never takes custody of your assets.</p>
    </section> : <>
      <div className="portfolio-top">
        <section className="card portfolio-summary">
          <div className="portfolio-summary-copy"><div className="portfolio-summary-main"><p className="eyebrow">Total portfolio</p><div className="metric">{fmtUsd(totals.total)}</div><p className="muted portfolio-live-note">Live wallet valuation</p></div><div className="portfolio-value-list"><div><span className="portfolio-value-icon portfolio-value-wallet" aria-hidden="true">◫</span><span>Wallet</span><b>{fmtUsd(totals.total === undefined && totals.wallet === "0" ? undefined : totals.wallet)}</b></div><div><span className="portfolio-value-icon portfolio-value-earn" aria-hidden="true">◉</span><span>Earn</span><b>{earn.loading ? "Loading…" : fmtUsd(earn.value)}</b></div></div></div>
          <div className={`portfolio-allocation${allocation ? "" : " portfolio-allocation-empty"}`} aria-label={allocation ? "Portfolio allocation between wallet and earn" : "Portfolio allocation unavailable until live values load"}><div className="portfolio-donut" style={allocation ? { background: `conic-gradient(#62a4fb 0 ${allocation.walletPercent}%, #9560f5 ${allocation.walletPercent}% ${allocation.walletPercent + allocation.earnPercent}%, #e8edf5 ${allocation.walletPercent + allocation.earnPercent}% 100%)` } : undefined}><div><b>{fmtUsd(totals.total)}</b><span>Portfolio</span></div></div><div className="portfolio-allocation-legend"><span><i className="portfolio-legend-wallet" />Wallet <b>{fmtUsd(totals.total === undefined && totals.wallet === "0" ? undefined : totals.wallet)}</b>{allocation && <em>{allocation.walletPercent.toFixed(1)}%</em>}</span><span><i className="portfolio-legend-earn" />Earn <b>{earn.loading ? "Loading…" : fmtUsd(earn.value)}</b>{allocation && <em>{allocation.earnPercent.toFixed(1)}%</em>}</span></div></div>
          <div className="portfolio-summary-status">{totals.missing > 0 && <p className="portfolio-warning">◐ Partial valuation</p>}{totals.missing > 0 && <p className="muted">• Unvalued assets {totals.missing}</p>}<p className="muted">• Unified Balance not included</p>{totals.unavailable > 0 && <p className="portfolio-warning portfolio-unavailable">• {totals.unavailable} network{totals.unavailable === 1 ? "" : "s"} unavailable</p>}</div>
        </section>
        <section className="card earn-card dashboard-earn-card"><div className="dashboard-earn-copy"><p className="eyebrow">In earn</p><h2>{earn.loading ? "Loading positions…" : earn.unavailable ? "Unavailable" : fmtUsd(earn.value ?? "0")}</h2><p className="muted earn-balance-caption">Total earning balance</p></div><div className="earn-position-row"><span className="earn-position-icon" aria-hidden="true">▤</span><span><b>{chainId !== ARC_MAINNET.id ? "Network unavailable" : earn.unavailable ? "Positions unavailable" : earn.positions ? `${earn.positions} active position${earn.positions === 1 ? "" : "s"}` : "No active positions"}</b><small>{chainId !== ARC_MAINNET.id ? "Switch to Arc Mainnet" : earn.unavailable ? "Try again shortly" : "Across supported vaults"}</small></span><i aria-hidden="true">›</i></div><Link href="/earn">View Earn<span aria-hidden="true">→</span></Link></section>
      </div>
    </>}

    <section className="dashboard-quick-actions"><h2>Quick actions</h2><div className="dashboard-workflows" aria-label="Stabio workflows">
      <WorkflowCard href="/move" icon="↔" title="Move" description="Bridge USDC across supported networks." action="Move" tone="blue" />
      <WorkflowCard href="/earn" icon="◉" title="Earn" description="Explore eligible USDC vault opportunities." action="Earn" tone="violet" />
      <WorkflowCard href="/swap" icon="⇄" title="Swap" description="Exchange supported assets on Arc." action="Swap" tone="teal" />
      <WorkflowCard href="/flows" icon="✦" title="Flows" description="Create payment links and payment requests." action="Create flow" tone="indigo" />
    </div></section>

    {address && <>
      <div className="earn-heading dashboard-assets-heading">
        <div><p className="eyebrow">Your assets</p><h2>Wallet networks</h2></div>
        <button onClick={() => setShowAll((value) => !value)}>{showAll ? "Hide empty networks" : "Show all networks"}</button>
      </div>
      <div className="portfolio-grid">
        {shown.map((row) => {
          const unvalued = row.assets.filter((asset) => asset.rawBalance > 0n && !asset.usdValue).length;
          const valued = row.assets.some((asset) => asset.rawBalance > 0n && asset.usdValue);
          const networkTotal = valued ? sumUsdValues(row.assets) : undefined;
          return <article className={`card network-card${row.chain.isArc ? " arc-network-card" : ""}`} key={row.chain.chainId}>
            <header className="network-card-header"><div className="network-card-name"><NetworkMark chain={row.chain} /><h3>{row.chain.isArc ? "Arc" : row.chain.name}</h3></div><b>{row.loading ? "Loading…" : row.unavailable ? "Unavailable" : fmtUsd(networkTotal)}</b></header>
            <div className="network-card-body">
              {unvalued > 0 && <p className="muted">{unvalued} asset{unvalued === 1 ? "" : "s"} not valued</p>}
              {row.unavailable ? <p className="muted">This network could not be read. Other networks remain available.</p> : row.assets.length === 0 ? <p className="muted">Native asset metadata is unavailable.</p> : <div className="asset-list">{row.assets.map((asset) => <div key={asset.identity}><span>{asset.symbol}</span><b>{fmtAmount(asset.normalizedAmount)} {asset.symbol}</b><em>{fmtUsd(asset.usdValue)}</em></div>)}</div>}
              <div className="network-actions">{row.chain.isArc ? <><Link href="/earn">Earn</Link><Link href="/swap">Swap</Link><Link href="/move">Move out</Link></> : <Link href={`/move?from=${encodeURIComponent(row.chain.name)}`}>Move to Arc</Link>}</div>
            </div>
          </article>;
        })}
      </div>
    </>}
  </section>;
}
