export function formatFlowDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const calendarDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return `${calendarDate} · ${time}`;
}
