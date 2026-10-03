import assert from "node:assert/strict";
import test from "node:test";
import { applyVerifiedPayment, createPayment, decodeSharedPayment, validAmount, validRecipient } from "../src/features/flows/services/payments.ts";

const recipient = "0x1234567890123456789012345678901234567890" as const;
const payment = () => createPayment({ type: "invoice", asset: "USDC", amount: "12.50", chainId: 5042, recipient, invoiceNumber: "INV-2026-001" });

test("validates payment amount and recipient", () => { assert.equal(validAmount("0"), false); assert.equal(validAmount("12.50"), true); assert.equal(validRecipient(recipient), true); assert.equal(validRecipient("0x123"), false); });
test("creates versioned waiting invoices", () => { const request = payment(); assert.equal(request.version, 1); assert.equal(request.status, "waiting"); assert.equal(request.invoiceNumber, "INV-2026-001"); });
test("paid status can only be formed from verified payment data", () => { const paid = applyVerifiedPayment(payment(), { transactionHash: "0xabc" as `0x${string}`, payer: recipient, paidAt: "2026-10-01T00:00:00.000Z" }); assert.equal(paid.status, "paid"); assert.equal(paid.transactionHash, "0xabc"); assert.equal(paid.payer, recipient); });
test("reconstructs a valid public payment request from its share payload", () => { const payload = btoa(JSON.stringify({ v: 1, id: "payment-id", type: "payment_link", amount: "4", asset: "USDC", chainId: 5042, recipient })); assert.equal(decodeSharedPayment(payload)?.recipient, recipient); });
