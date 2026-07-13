import type { PeriodContext, RideRow } from "../types.js";

export function inferPeriodDaysFromRides(rides: RideRow[]): number {
  const dates = rides
    .map((r) => r.timestamp?.slice(0, 10))
    .filter((d): d is string => Boolean(d && d.length >= 10));
  if (dates.length < 2) return 28;
  const unique = [...new Set(dates)].sort();
  const spanMs = Date.parse(unique[unique.length - 1]!) - Date.parse(unique[0]!);
  if (!Number.isFinite(spanMs) || spanMs < 0) return 28;
  return Math.max(7, Math.min(31, Math.round(spanMs / 86400000) + 1));
}

export function buildPeriodLabel(rides: RideRow[], periodDays: number): string {
  const dates = rides
    .map((r) => r.timestamp?.slice(0, 10))
    .filter((d): d is string => Boolean(d && d.length >= 10))
    .sort();
  if (dates.length === 0) return `${periodDays}-day baseline`;
  const start = dates[0]!;
  const end = dates[dates.length - 1]!;
  const fmt = (d: string) => {
    const parsed = Date.parse(d);
    if (Number.isNaN(parsed)) return d;
    return new Date(parsed).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  };
  return `${fmt(start)}–${fmt(end)} (${periodDays} days)`;
}

export function buildPeriodContext(rides: RideRow[], revenue: number): PeriodContext {
  const periodDays = inferPeriodDaysFromRides(rides);
  const monthlyRunRateEur = Math.round(revenue * (30 / periodDays) * 100) / 100;
  return {
    periodDays,
    periodLabel: buildPeriodLabel(rides, periodDays),
    monthlyRunRateEur
  };
}
