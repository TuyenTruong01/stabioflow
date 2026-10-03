import type { SwapQuote } from "../../swap/types.ts";
import { decimal } from "./decimal.ts";

/** Only explicit, parseable USDC fees can be compared to a USDC fee limit. */
export function validateQuoteFeeLimit(quote: Pick<SwapQuote, "fees">, maxFee: string): { ok: true; total: bigint } | { ok: false; reason: string } {
  let total = 0n;
  for (const fee of quote.fees) {
    if (fee.token !== "USDC" || !fee.amount) return { ok: false, reason: "Unable to verify this safety limit from the current quote." };
    try { total += decimal(fee.amount); } catch { return { ok: false, reason: "Unable to verify this safety limit from the current quote." }; }
  }
  try { if (total > decimal(maxFee)) return { ok: false, reason: "The verified quote fee exceeds this plan’s maximum fee." }; } catch { return { ok: false, reason: "Unable to verify this safety limit from the current quote." }; }
  return { ok: true, total };
}
