"use client";

import { useParams, useSearchParams } from "next/navigation";
import { PaymentActivity } from "@/features/flows/components/Flows";
import { decodeSharedPayment } from "@/features/flows/services/payments";

export default function ReceiptPage() { const params = useParams<{ id: string }>(); const search = useSearchParams(); return <PaymentActivity receiptId={params.id} sharedRequest={decodeSharedPayment(search.get("request") ?? undefined)} />; }
