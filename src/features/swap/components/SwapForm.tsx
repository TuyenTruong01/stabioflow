"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AmountAllocationControl } from "@/components/AmountAllocationControl";
import { useWallet } from "@/components/Wallet/WalletProvider";
import { ARC_MAINNET } from "@/config/chains";
import { ARC_SWAP_TOKENS, type SwapQuote, type SwapResultView, type SwapToken } from "@/features/swap/types";
import { estimateSwap, executeSwap, readSwapBalance } from "@/features/swap/services/swap";
import "./swap-token-icons.css";

function number(value?: string, digits = 8) { return value ? Number(value).toLocaleString("en-US", { maximumFractionDigits: digits }) : "—"; }
const tokenIcon: Record<SwapToken, { src: string; alt: string }> = {
  USDC: { src: "/images/tokens/usdc.svg", alt: "USDC" },
  EURC: { src: "/images/tokens/eurc.svg", alt: "EURC" },
  cirBTC: { src: "/images/tokens/bitcoin.svg", alt: "Bitcoin" },
};
function rate(quote: SwapQuote | undefined, tokenIn: SwapToken, tokenOut: SwapToken) {
  if (!quote || !Number(quote.amountIn)) return "—";
  const value = Number(quote.estimatedOutput) / Number(quote.amountIn);
  return Number.isFinite(value) ? `1 ${tokenIn} = ${number(String(value))} ${tokenOut}` : "—";
}
function TokenSelector({ value, excluded, onChange }: { value: SwapToken; excluded: SwapToken; onChange: (token: SwapToken) => void }) {
  const icon = tokenIcon[value];
  return <div className="swap-token-selector"><Image className="swap-token-mark" src={icon.src} width={32} height={32} alt="" aria-hidden="true" /><select value={value} onChange={(event) => onChange(event.target.value as SwapToken)} aria-label={`Select ${value} token`}>{ARC_SWAP_TOKENS.filter((token) => token !== excluded).map((token) => <option key={token}>{token}</option>)}</select></div>;
}
function message(error: unknown) {
  const text = error instanceof Error ? error.message : "The Swap Kit request failed.";
  if (/reject|denied|cancel/i.test(text)) return "The wallet request was cancelled.";
  if (/route|liquidity|pair|support/i.test(text)) return "No live quote is available for this amount. Try a larger amount or a different asset pair.";
  return text.length > 180 ? "The live swap request failed. Please try again." : text;
}

export function SwapForm() {
  const { address, chainId, provider, switchToArc } = useWallet();
  const [tokenIn, setTokenIn] = useState<SwapToken>("USDC");
  const [tokenOut, setTokenOut] = useState<SwapToken>("cirBTC");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState<string>();
  const [outputBalance, setOutputBalance] = useState<string>();
  const [quote, setQuote] = useState<SwapQuote>();
  const [slippage, setSlippage] = useState("3");
  const [amountPercent, setAmountPercent] = useState(100);
  const [state, setState] = useState("Idle");
  const [error, setError] = useState<string>();
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState<SwapResultView>();
  const onArc = chainId === ARC_MAINNET.id;
  const slippageBps = Math.round(Number(slippage) * 100);
  const amountValid = Number(amount) > 0 && Number.isFinite(Number(amount));
  const hasFunds = balance !== undefined && amountValid && Number(amount) <= Number(balance);

  const clearQuote = useCallback(() => { setQuote(undefined); setError(undefined); setReviewing(false); setResult(undefined); }, []);
  const refreshBalance = useCallback(async () => {
    if (!address || !provider || !onArc) { setBalance(undefined); setOutputBalance(undefined); return; }
    try { setBalance(undefined); setOutputBalance(undefined); const [next, output] = await Promise.all([readSwapBalance(provider, address as `0x${string}`, tokenIn), readSwapBalance(provider, address as `0x${string}`, tokenOut)]); setBalance(next.formatted); setOutputBalance(output.formatted); }
    catch (cause) { setBalance(undefined); setOutputBalance(undefined); setError(message(cause)); }
  }, [address, onArc, provider, tokenIn, tokenOut]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshBalance(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshBalance]);

  const getQuote = useCallback(async () => {
    clearQuote();
    if (!address) return setError("Connect a wallet to request a live quote.");
    if (!onArc) return setError("Switch the wallet to Arc Mainnet before requesting a quote.");
    if (!amountValid) return setError("Enter an amount greater than zero.");
    if (balance !== undefined && Number(amount) > Number(balance)) return setError("Amount exceeds the available balance.");
    if (!Number.isFinite(slippageBps) || slippageBps <= 0 || slippageBps > 10_000) return setError("Slippage must be greater than 0% and no more than 100%.");
    setState("Getting quote");
    try { if (!provider) throw new Error("Choose a wallet first."); const next = await estimateSwap(provider, tokenIn, tokenOut, amount, slippageBps); setQuote(next); setState("Quote ready"); }
    catch (cause) { setState("Quote failed"); setError(message(cause)); }
  }, [address, amount, amountValid, balance, clearQuote, onArc, provider, slippageBps, tokenIn, tokenOut]);
  useEffect(() => {
    if (result || !address || !onArc || !amountValid || !hasFunds || !Number.isFinite(slippageBps) || slippageBps <= 0) return;
    const timer = window.setTimeout(() => { void getQuote(); }, 550);
    return () => window.clearTimeout(timer);
  }, [address, amountValid, getQuote, hasFunds, onArc, result, slippageBps]);
  const reverse = () => { setTokenIn(tokenOut); setTokenOut(tokenIn); setAmount(""); clearQuote(); setState("Idle"); };
  const confirm = async () => {
    if (!quote || !provider) return;
    setState("Waiting for wallet"); setError(undefined);
    try { const next = await executeSwap(provider, tokenIn, tokenOut, amount, slippageBps); setResult(next); setState(next.status === "DONE" ? "Completed" : "Submitted"); setReviewing(false); setQuote(undefined); await refreshBalance(); }
    catch (cause) { setState("Failed"); setError(message(cause)); }
  };
  const fee = useMemo(() => quote?.fees.map((item) => `${number(item.amount ?? undefined, 5)} ${item.token ?? ""}`).join(" · ") || "Unavailable", [quote]);
  const reviewDisabled = !address || !onArc || !hasFunds || !quote;
  const waitingForWallet = state === "Waiting for wallet";
  const applyAmountPercent = (percent: number) => { if (!balance) return; setAmountPercent(percent); setAmount((Number(balance) * percent / 100).toFixed(18).replace(/\.?0+$/, "")); clearQuote(); setState("Idle"); };

  return <div className="swap-card">
    <div className="swap-field swap-pay-panel"><label>YOU PAY</label><div className="swap-input"><input inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); clearQuote(); }} placeholder="0.00" /><TokenSelector value={tokenIn} excluded={tokenOut} onChange={(token) => { setTokenIn(token); clearQuote(); }} /></div><div className="swap-meta"><span>Balance: {number(balance, tokenIn === "USDC" ? 3 : 8)} {tokenIn}</span><AmountAllocationControl percent={amountPercent} onPercent={applyAmountPercent} /></div></div>
    <div className="swap-direction"><i aria-hidden="true" /><button className="swap-reverse" onClick={reverse} aria-label="Reverse swap direction">⇅</button><i aria-hidden="true" /></div>
    <div className="swap-field swap-receive-panel"><label>YOU RECEIVE</label><div className="swap-input output"><strong>{result?.received ? number(result.received) : quote ? number(quote.estimatedOutput) : "—"}</strong><TokenSelector value={tokenOut} excluded={tokenIn} onChange={(token) => { setTokenOut(token); clearQuote(); }} /></div><div className="swap-meta"><span>Balance: {number(outputBalance, tokenOut === "USDC" ? 3 : 8)} {tokenOut}</span></div></div>
    {result ? <><div className={`swap-result ${result.status === "DONE" ? "swap-result-completed" : "swap-result-submitted"}`}><h2>{result.status === "DONE" ? "✓ Swap completed" : "◷ Transaction submitted"}</h2><p>{result.status === "DONE" ? "Your swap has been completed." : "Your transaction was sent. Track it in the explorer for confirmation."}</p><div><span>Paid</span><b>{number(result.paid, tokenIn === "USDC" ? 3 : 8)} {tokenIn}</b></div>{result.received && <div><span>Received</span><b>{number(result.received, tokenOut === "USDC" ? 3 : 8)} {tokenOut}</b></div>}</div><div className="swap-result-actions">{result.explorerUrl && <a href={result.explorerUrl} target="_blank" rel="noreferrer">View transaction</a>}<button className="swap-cancel" onClick={() => { setAmount(""); clearQuote(); setState("Idle"); }}>New swap</button></div></> : <>
    {!address && <p className="swap-note">Connect a wallet to read balances and request a quote.</p>}
    {address && !onArc && <div className="swap-network"><span>Wallet is not on Arc Mainnet.</span><button onClick={() => void switchToArc()}>Switch to Arc</button></div>}
    {error && <p className="error">{error}</p>}
    {!reviewing && <><div className="swap-details"><h2>Swap details</h2><span>Rate <b>{rate(quote, tokenIn, tokenOut)}</b></span><span>Minimum received <b>{quote ? `${number(quote.minimumReceived)} ${tokenOut}` : "—"}</b></span><span>Price impact <span><button className="swap-info" type="button" title="Not provided by the current quote." aria-label="Price impact information">ⓘ</button><b>Unavailable</b></span></span><span>Network fee <span><button className="swap-info" type="button" title="Not provided by the current quote." aria-label="Network fee information">ⓘ</button><b>{fee}</b></span></span><span>Slippage <b className="slippage-control"><input aria-label="Slippage percent" value={slippage} inputMode="decimal" onChange={(event) => { setSlippage(event.target.value); clearQuote(); }} /><i>%</i></b></span></div><div className="swap-action">{quote ? <button className="swap-review" disabled={reviewDisabled} onClick={() => setReviewing(true)}>Review Swap</button> : <button className="swap-primary" disabled={!address || !onArc || !amountValid || !hasFunds || state === "Getting quote"} onClick={() => void getQuote()}>{state === "Getting quote" ? "Getting quote…" : "Swap"}</button>}</div></>}
    {reviewing && quote && <><div className="swap-review-panel"><h2>Review Swap</h2><p>You pay <b>{amount} {tokenIn}</b></p><p>You receive <b>{number(quote.estimatedOutput)} {tokenOut}</b></p><p>Minimum received <b>{number(quote.minimumReceived)} {tokenOut}</b></p><p>Slippage <b>{slippage}%</b></p><p>Network <b>Arc Mainnet</b></p><p>Network fee <b>{fee}</b></p></div><div className="swap-review-actions"><button className="swap-primary" disabled={waitingForWallet} onClick={() => void confirm()}>{waitingForWallet ? "Waiting for wallet…" : "Confirm Swap"}</button>{waitingForWallet ? <p className="swap-wallet-wait">Confirm this swap in your wallet.</p> : <button className="swap-cancel" onClick={() => setReviewing(false)}>Cancel</button>}</div></>}
    {!reviewing && state !== "Idle" && <p className="swap-state">{state === "Quote ready" ? "Ready to review" : state}</p>}</>}
  </div>;
}
