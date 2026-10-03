export type PaymentStatus = "waiting" | "paid" | "expired" | "failed";
export type PaymentKind = "payment_link" | "invoice";
export type PaymentRequest = { version: 1; id: string; type: PaymentKind; asset: "USDC"; amount: string; chainId: 5042; recipient: `0x${string}`; description?: string; invoiceNumber?: string; client?: string; dueDate?: string; createdAt: string; status: PaymentStatus; transactionHash?: string; payer?: `0x${string}`; paidAt?: string };
export type SharedPaymentRequest = Pick<PaymentRequest, "id" | "type" | "amount" | "asset" | "chainId" | "recipient"> & { v: 1 };
const KEY = "stabio-flows-payments-v1";
const empty = (): PaymentRequest[] => [];
export function validAmount(amount: string) { return /^\d+(\.\d+)?$/.test(amount) && Number(amount) > 0; }
export function validRecipient(address: string): address is `0x${string}` { return /^0x[a-fA-F0-9]{40}$/.test(address); }
export function loadPayments(): PaymentRequest[] { if (typeof window === "undefined") return empty(); try { const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]"); return Array.isArray(value) ? value.filter((item): item is PaymentRequest => item?.version === 1 && validAmount(item.amount) && validRecipient(item.recipient)) : empty(); } catch { return empty(); } }
export function savePayments(items: PaymentRequest[]) { window.localStorage.setItem(KEY, JSON.stringify(items)); }
export function createPayment(input: Omit<PaymentRequest, "version" | "id" | "createdAt" | "status">): PaymentRequest { if (!validAmount(input.amount)) throw new Error("Enter a valid amount."); if (!validRecipient(input.recipient)) throw new Error("Enter a valid recipient wallet."); return { ...input, version: 1, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "waiting" }; }
export type VerifiedPayment = { transactionHash: `0x${string}`; payer: `0x${string}`; paidAt: string };
export interface PaymentVerifier { verify(request: PaymentRequest): Promise<VerifiedPayment | undefined>; }
export function applyVerifiedPayment(request: PaymentRequest, verified: VerifiedPayment): PaymentRequest { return { ...request, status: "paid", transactionHash: verified.transactionHash, payer: verified.payer, paidAt: verified.paidAt }; }
export function decodeSharedPayment(value?: string): SharedPaymentRequest | undefined { try { const item = JSON.parse(atob(value ?? "")); return item?.v === 1 && (item.type === "payment_link" || item.type === "invoice") && item.asset === "USDC" && item.chainId === 5042 && validAmount(item.amount) && validRecipient(item.recipient) && typeof item.id === "string" ? item : undefined; } catch { return undefined; } }
