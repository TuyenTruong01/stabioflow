export function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
}

export function formatUsdc(value?: bigint) {
  if (value === undefined) return "—";
  const whole = value / 10n ** 18n;
  const fraction = (value % 10n ** 18n).toString().padStart(18, "0").slice(0, 2);
  return `${whole.toLocaleString("en-US")}.${fraction}`;
}

export function formatDisplayNumber(value: string | number | bigint, maximumFractionDigits = 6, minimumFractionDigits = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString("en-US", { maximumFractionDigits, minimumFractionDigits }) : "—";
}
