"use client";

import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { useWallet } from "@/components/Wallet/WalletProvider";
import { ARC_MAINNET } from "@/config/chains";
import { createPayment, loadPayments, savePayments, validAmount, validRecipient, type PaymentKind, type PaymentRequest } from "@/features/flows/services/payments";
import { formatDisplayNumber } from "@/lib/wallet/format";
import "./request-payment.css";

type RequestMode = Extract<PaymentKind, "payment_link" | "invoice">;

const short = (value?: string) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—";
const labelFor = (mode: RequestMode) => mode === "invoice" ? "Invoice" : "Payment Link";

export function RequestPaymentComposer({ initialMode = "payment_link" }: { initialMode?: RequestMode }) {
  const { address } = useWallet();
  const [mode, setMode] = useState<RequestMode>(initialMode);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-001`);
  const [client, setClient] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [result, setResult] = useState<PaymentRequest>();
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const creationInFlight = useRef(false);
  const selectedRecipient = recipient || address || "";
  const canCreate = validAmount(amount) && validRecipient(selectedRecipient) && !creating;
  const link = result && typeof window !== "undefined" ? `${window.location.origin}/flows/receipts/${result.id}?request=${encodeURIComponent(btoa(JSON.stringify({ v: 1, id: result.id, type: result.type, amount: result.amount, asset: result.asset, chainId: result.chainId, recipient: result.recipient })))}` : "";

  const create = () => {
    if (!canCreate || creationInFlight.current) return;
    creationInFlight.current = true;
    setCreating(true);
    try {
      const item = createPayment({ type: mode, asset: "USDC", amount, chainId: ARC_MAINNET.id, recipient: selectedRecipient as `0x${string}`, description, ...(mode === "invoice" ? { invoiceNumber, client, dueDate: dueDate || undefined } : {}) });
      savePayments([item, ...loadPayments()]);
      setResult(item);
      setError("");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not create request.");
    } finally {
      creationInFlight.current = false;
      setCreating(false);
    }
  };

  const reset = () => { setAmount(""); setDescription(""); setRecipient(""); setInvoiceNumber(`INV-${new Date().getFullYear()}-001`); setClient(""); setDueDate(""); setError(""); setResult(undefined); };
  const copy = () => void navigator.clipboard.writeText(link);
  const share = () => { if (navigator.share) void navigator.share({ title: `Stabio Flow ${labelFor(result?.type ?? mode)}`, url: link }); else copy(); };

  return <section className="flows-page request-payment-page">
    <header className="flows-header request-payment-header"><Link className="back-to-flows" href="/flows">← Back to Flows</Link><h1>Request Payment</h1><p className="lead">Create a payment request and receive USDC on Arc.</p></header>
    {!result ? <section className="card request-payment-composer" aria-label="Create payment request">
      <div className="request-type-switch" role="tablist" aria-label="Request type">{(["payment_link", "invoice"] as const).map((type) => <button aria-selected={mode === type} className={mode === type ? "active" : ""} key={type} onClick={() => setMode(type)} role="tab" type="button">{labelFor(type)}</button>)}</div>
      <p className="request-payment-label">Receive</p>
      <label className="request-amount-field">Amount<div className="request-amount-input"><input value={amount} inputMode="decimal" placeholder="25.00" onChange={(event) => { setAmount(event.target.value); setError(""); }} /><span><Image src="/images/tokens/usdc.svg" width={28} height={28} alt="" aria-hidden="true" />USDC</span></div></label>
      <div className="request-payment-meta"><span><Image src="/images/tokens/usdc.svg" width={20} height={20} alt="" aria-hidden="true" />USDC</span><i aria-hidden="true">•</i><span><Image src="/images/chains/arc.png" width={20} height={20} alt="" aria-hidden="true" />Arc Mainnet</span></div>
      <label className="request-payment-field">Recipient<div className="request-recipient-control"><input value={selectedRecipient} placeholder="Connect wallet or enter recipient" onChange={(event) => { setRecipient(event.target.value); setError(""); }} />{selectedRecipient && <button type="button" onClick={() => void navigator.clipboard.writeText(selectedRecipient)}>Copy</button>}</div>{address && !recipient && <small>Connected wallet</small>}</label>
      <label className="request-payment-field">Description<input value={description} placeholder="Optional description" onChange={(event) => setDescription(event.target.value)} /></label>
      {mode === "invoice" && <fieldset className="invoice-details"><legend>Invoice details</legend><div className="invoice-details-row"><label>Invoice number<input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} /></label><label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div><label>Client / customer<input value={client} placeholder="Optional client/customer name" onChange={(event) => setClient(event.target.value)} /></label></fieldset>}
      {error && <p className="error">{error}</p>}
      <button className="request-payment-submit" disabled={!canCreate} onClick={create}>{creating ? "Creating…" : `Create ${mode === "invoice" ? "invoice" : "payment link"}`}</button>
    </section> : <section className="card request-payment-result">
      <span className="request-payment-success" aria-hidden="true">✓</span><p>{result.type === "invoice" ? "Invoice created" : "Payment link created"}</p>{result.type === "invoice" && <b className="request-invoice-number">{result.invoiceNumber}</b>}<strong>{formatDisplayNumber(result.amount)} {result.asset}</strong><span className="request-payment-network"><Image src="/images/chains/arc.png" width={20} height={20} alt="" aria-hidden="true" />Arc Mainnet</span>
      <dl className="request-result-details">{result.client && <div><dt>Client</dt><dd>{result.client}</dd></div>}{result.dueDate && <div><dt>Due</dt><dd>{result.dueDate}</dd></div>}<div><dt>Recipient</dt><dd title={result.recipient}>{short(result.recipient)}</dd></div></dl><div className="payment-qr"><QRCodeSVG value={link} size={164} includeMargin title="Payment request QR code" /></div>
      <div className="request-result-actions"><button className="request-payment-submit" onClick={copy}>Copy payment link</button><button className="request-payment-share" onClick={share}>{result.type === "invoice" ? "Share invoice →" : "Share payment request →"}</button></div><button className="request-new-payment" onClick={reset}>New payment request</button>
    </section>}
  </section>;
}
