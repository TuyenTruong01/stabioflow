import { Suspense } from "react";
import { MoveBridge } from "@/features/move/components/MoveBridge";

export default function MovePage() { return <section className="move-page"><h1>Move</h1><p className="lead">Move USDC between Arc and supported networks. Preview live costs before confirming.</p><Suspense fallback={<p className="muted">Preparing Move…</p>}><MoveBridge /></Suspense></section>; }
