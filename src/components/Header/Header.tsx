"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";
import { ARC_MAINNET } from "@/config/chains";
import { bridgeChains } from "@/features/move/services/bridge";
import { shortAddress } from "@/lib/wallet/format";
import { resolveNetworkDisplayName } from "@/lib/network-display";
import { useWallet } from "@/components/Wallet/WalletProvider";
import "./header-controls.css";

const nav = [["Dashboard", "/"], ["Move", "/move"], ["Earn", "/earn"], ["Swap", "/swap"], ["Flows", "/flows"], ["About", "/help"]] as const;
export function Header() {
  const pathname = usePathname(); const { address, chainId, balance, isConnecting, wallets, connect, disconnect, switchToArc } = useWallet(); const [menu, setMenu] = useState(false); const [open, setOpen] = useState(false); const [picker, setPicker] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) { setOpen(false); setPicker(false); } }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  const networkName = resolveNetworkDisplayName(chainId, bridgeChains()); const usdc = balance === undefined ? "—" : Number(formatUnits(balance, 18)).toLocaleString("en-US", { maximumFractionDigits: 4 });
  return <header className="topbar"><Link className="brand" href="/"><Image src="/logo.png" width={44} height={44} alt="Stabio Flow logo" priority /><span><strong>Stabio Flow</strong><small>Built on Arc</small></span></Link><nav className={menu ? "open" : ""}>{nav.map(([label, href]) => <Link onClick={() => setMenu(false)} className={pathname === href ? "active" : ""} href={href} key={href}>{label}</Link>)}</nav><div className="wallet-area" ref={ref}>{address ? <><button className="network network-button header-control" onClick={() => chainId !== ARC_MAINNET.id && void switchToArc()}>{networkName}</button><button className="wallet wallet-summary header-control" onClick={() => setOpen((visible) => !visible)}><span className="header-control-icon" aria-hidden="true">▣</span><b>{shortAddress(address)}</b></button>{open && <div className="wallet-popover"><button className="wallet-close" onClick={() => setOpen(false)}>×</button><Image src="/logo.png" width={64} height={64} alt="" /><strong>{shortAddress(address)}</strong><small>{usdc} USDC</small><div><button onClick={() => address && void navigator.clipboard.writeText(address)}>▣<span>Copy Address</span></button><button onClick={() => { disconnect(); setOpen(false); }}>⇥<span>Disconnect</span></button></div></div>}</> : <><button className="wallet" disabled={isConnecting} onClick={() => setPicker((visible) => !visible)}>▣ {isConnecting ? "Connecting…" : "Connect Wallet"}</button>{picker && <div className="wallet-picker"><b>Choose wallet</b>{wallets.length ? wallets.map((wallet) => <button key={wallet.id} disabled={isConnecting} onClick={() => { void connect(wallet.id); setPicker(false); }}><span aria-hidden="true">◈</span>{wallet.name}</button>) : <p>No compatible wallet detected.</p>}</div>}</>}</div><button className="menu" aria-expanded={menu} onClick={() => setMenu((visible) => !visible)}>☰</button></header>;
}
