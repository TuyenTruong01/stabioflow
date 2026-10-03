"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ARC_MAINNET } from "@/config/chains";
import { formatFlowDate } from "@/lib/flow-format";
import { formatDisplayNumber } from "@/lib/wallet/format";
import { loadPayments, type PaymentRequest, type PaymentStatus, type SharedPaymentRequest } from "@/features/flows/services/payments";
import "./flows-cleanup.css";
import "./flows-request-card.css";
import "./payment-activity.css";

type ActivityFilter = "all" | "waiting" | "paid";
type DetailRequest = PaymentRequest | SharedPaymentRequest;

const short = (value?: string) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—";
const displayAmount = (value: string) => formatDisplayNumber(value, 6, 2);
const requestTypeLabel = (type: DetailRequest["type"]) => type === "invoice" ? "Invoice" : "Payment Link";
const statusLabel = (status: PaymentStatus) => status.charAt(0).toUpperCase() + status.slice(1);
const cards = [
  ["autopilot", "Autopilot", "Automate recurring BTC purchases.", "Scheduled DCA · Smart DCA", "Open Autopilot", "/automate"],
  ["request", "Request Payment", "Create a payment link or invoice.", "USDC · Arc Mainnet", "Request payment", "/flows/request"],
  ["activity", "Payment Activity", "Track payments and receipts.", "Waiting · Paid · Receipts", "View activity", "/flows/activity"],
] as const;
const agents = [
  ["Payment Agent", "Prepare payment requests and monitor their status.", "↗"],
  ["Treasury Agent", "Track USDC balances and suggest funding routes.", "◫"],
  ["Yield Agent", "Monitor Earn positions and vault opportunities.", "◌"],
  ["Risk Agent", "Flag limits, failed routes and unusual activity.", "◈"],
  ["Settlement Agent", "Reconcile invoices, receipts and onchain payments.", "✓"],
  ["Service Agent", "Handle usage-based USDC payments for services.", "⌁"],
] as const;

export const BackToFlows = () => <Link className="back-to-flows" href="/flows">← Back to Flows</Link>;

function FlowsHeader({ title, description, back = false }: { title: string; description: string; back?: boolean }) { return <header className="flows-header">{back && <BackToFlows />}<h1>{title}</h1><p className="lead">{description}</p></header>; }
function StatusBadge({ status }: { status: PaymentStatus }) { return <span className={`payment-status ${status}`}>{statusLabel(status)}</span>; }
function paymentLink(request: Pick<PaymentRequest, "id" | "type" | "amount" | "asset" | "chainId" | "recipient">) { return typeof window === "undefined" ? "" : `${window.location.origin}/flows/receipts/${request.id}?request=${encodeURIComponent(btoa(JSON.stringify({ v: 1, id: request.id, type: request.type, amount: request.amount, asset: request.asset, chainId: request.chainId, recipient: request.recipient })))}`; }

export function FlowsOverview() { return <section className="flows-page flows-overview"><FlowsHeader title="Payment & Automation" description="Automation and payment tools for Arc." /><div className="flows-grid">{cards.map(([kind, title, description, meta, label, href]) => <article className={`card flow-card flow-card-${kind}`} key={kind}><div className="flow-card-content"><span className="flow-icon" aria-hidden="true">{kind === "autopilot" ? "◷" : kind === "request" ? "↗" : "▥"}</span><div><h2>{title}</h2><p className="muted">{description}</p><p className="flow-meta">{meta}</p><Link className="flow-button" href={href}>{label}<span aria-hidden="true">→</span></Link></div></div><span className={`flow-illustration flow-illustration-${kind === "request" ? "links" : kind}`} aria-hidden="true"><i /><i /><i /></span></article>)}</div><section className="agents-section" aria-labelledby="agents-heading"><div className="agents-heading"><div><h2 id="agents-heading">Agents</h2><p>Independent agent capabilities planned for Stabio Flow.</p></div><span>Coming soon</span></div><div className="agents-grid">{agents.map(([title, description, icon]) => <article className="card agent-card" key={title}><span className="agent-icon" aria-hidden="true">{icon}</span><div><h3>{title}</h3><p>{description}</p></div><span className="agent-status">Coming soon</span></article>)}</div></section></section>; }

export function PaymentActivity({ receiptId, sharedRequest }: { receiptId?: string; sharedRequest?: SharedPaymentRequest }) {
  const [records, setRecords] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>("all");
  useEffect(() => { const timer = window.setTimeout(() => setRecords(loadPayments()), 0); return () => window.clearTimeout(timer); }, []);
  const current = receiptId ? records.find((record) => record.id === receiptId) : undefined;
  const request = current ?? sharedRequest;
  if (receiptId) return <ReceiptDetail request={request} current={current} />;
  const visibleRecords = records.filter((record) => filter === "all" || record.status === filter);
  return <section className="flows-page payment-activity-page"><FlowsHeader back title="Payment Activity" description="Track payment requests and verified receipts." />{records.length ? <><div className="activity-filter" aria-label="Filter payment activity">{(["all", "waiting", "paid"] as const).map((value) => <button className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)} type="button">{value === "all" ? "All" : statusLabel(value)}</button>)}</div>{visibleRecords.length ? <div className="activity-records">{visibleRecords.map((record) => <Link className="activity-record" href={`/flows/receipts/${record.id}`} key={record.id}><div className="activity-record-copy"><b>{record.description || record.invoiceNumber || "Payment request"}</b><span>{requestTypeLabel(record.type)} <i aria-hidden="true">·</i> {formatFlowDate(record.createdAt)}</span></div><strong>{displayAmount(record.amount)} {record.asset}</strong><StatusBadge status={record.status} /><em>View →</em></Link>)}</div> : <div className="card activity-empty"><h2>No {filter === "all" ? "payment" : statusLabel(filter)} requests.</h2><p>There are no payment requests with this status.</p></div>}</> : <div className="card activity-empty"><h2>No payment requests yet.</h2><p>Create a payment link or invoice to receive USDC on Arc.</p><Link className="activity-empty-action" href="/flows/request">Request payment →</Link></div>}</section>;
}

function ReceiptDetail({ request, current }: { request?: DetailRequest; current?: PaymentRequest }) {
  if (!request) return <section className="flows-page payment-detail-page"><header className="flows-header"><Link className="back-to-flows" href="/flows/activity">← Back to Payment Activity</Link><h1>Payment request</h1><p className="lead">Payment request details.</p></header><p className="muted">Payment request not found.</p></section>;
  const status = current?.status ?? "waiting";
  const paid = status === "paid";
  const link = paymentLink(request);
  const copyAddress = () => void navigator.clipboard.writeText(request.recipient);
  const copyLink = () => void navigator.clipboard.writeText(link);
  return <section className="flows-page payment-detail-page"><header className="flows-header payment-detail-header"><Link className="back-to-flows" href="/flows/activity">← Back to Payment Activity</Link><h1>{paid ? "Payment received" : status === "waiting" ? "Waiting for payment" : "Payment request"}</h1><p className="lead">{paid ? "Verified payment receipt." : "This request will show a receipt after on-chain payment is verified."}</p></header><article className="card payment-detail-card"><div className="payment-detail-topline"><p>{requestTypeLabel(request.type)}</p><StatusBadge status={status} /></div><strong className="payment-detail-amount">{displayAmount(request.amount)} {request.asset}</strong>{current?.description && <p className="payment-detail-description">{current.description}</p>}<dl className="payment-detail-list"><div><dt>Recipient</dt><dd><span title={request.recipient}>{short(request.recipient)}</span><button onClick={copyAddress} type="button">Copy</button></dd></div><div><dt>Network</dt><dd>Arc Mainnet</dd></div>{current?.createdAt && <div><dt>Created</dt><dd>{formatFlowDate(current.createdAt)}</dd></div>}<div><dt>Type</dt><dd>{requestTypeLabel(request.type)}</dd></div>{current?.invoiceNumber && <div><dt>Invoice number</dt><dd>{current.invoiceNumber}</dd></div>}{current?.client && <div><dt>Client</dt><dd>{current.client}</dd></div>}{current?.dueDate && <div><dt>Due date</dt><dd>{current.dueDate}</dd></div>}{paid && current?.paidAt && <div><dt>Paid</dt><dd>{formatFlowDate(current.paidAt)}</dd></div>}{paid && current?.transactionHash && <div><dt>Transaction</dt><dd><span title={current.transactionHash}>{short(current.transactionHash)}</span></dd></div>}</dl>{paid ? <p className="payment-detail-note success">Payment has been verified.</p> : <p className="payment-detail-note">Payment has not been verified yet.</p>}<div className="payment-detail-actions">{link && <button className="payment-detail-primary" onClick={copyLink} type="button">Copy payment link</button>}<button className="payment-detail-secondary" onClick={copyAddress} type="button">Copy address</button>{paid && current?.transactionHash && <a href={`${ARC_MAINNET.explorerUrl}/tx/${current.transactionHash}`} rel="noreferrer" target="_blank">View on Explorer</a>}</div></article></section>;
}
