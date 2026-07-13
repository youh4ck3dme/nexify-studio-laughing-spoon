export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatEur(value: number): string {
  return `€${value.toLocaleString("en-EU", { maximumFractionDigits: 0 })}`;
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatTrend(direction: "up" | "down" | "flat", deltaPct: number): string {
  if (direction === "flat") return "—";
  const sign = direction === "up" ? "+" : "";
  return `${sign}${deltaPct.toFixed(1)}%`;
}
