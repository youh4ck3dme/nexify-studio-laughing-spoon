import type {
  FleetKpis,
  LeadRow,
  OpportunityProjection,
  PeriodContext,
  RideRow,
  ZoneMetrics
} from "../types.js";

const PEAK_HOURS = new Set([17, 18, 19]);
const LEAD_CAPTURE_RATE = 0.15;
const ZONE_CAPTURE_RATE = 0.25;
const PRICING_CAPTURE_RATE = 0.08;
const BEST_MULTIPLIER = 1.28;
const WORST_MULTIPLIER = 0.72;
const MONTHLY_CAP_PCT = 0.55;

type OpportunityInputs = {
  rides: RideRow[];
  leads: LeadRow[];
  kpis: FleetKpis;
  zones: ZoneMetrics[];
  period: PeriodContext;
};

export function computeOpportunityProjection(inputs: OpportunityInputs): OpportunityProjection {
  const { rides, leads, kpis, zones, period } = inputs;
  const monthlyScale = 30 / period.periodDays;
  const avgFare = kpis.completedRides > 0 ? kpis.revenue / kpis.completedRides : 15;

  const lostLeads = leads.filter((l) => l.status === "new" || l.status === "lost").length;
  const leadRecoveryPeriod = lostLeads * avgFare * LEAD_CAPTURE_RATE;

  const topZone = [...zones].sort((a, b) => b.revenueOpportunity - a.revenueOpportunity)[0];
  const zoneRebalancePeriod = topZone ? topZone.revenueOpportunity * ZONE_CAPTURE_RATE : 0;

  const eveningCompleted = rides.filter(
    (r) => PEAK_HOURS.has(r.hourSlot) && r.status === "completed"
  );
  const allCompleted = rides.filter((r) => r.status === "completed");
  const avgEvening =
    eveningCompleted.length > 0
      ? eveningCompleted.reduce((s, r) => s + r.fare, 0) / eveningCompleted.length
      : avgFare;
  const avgAll =
    allCompleted.length > 0
      ? allCompleted.reduce((s, r) => s + r.fare, 0) / allCompleted.length
      : avgFare;
  const fareGap = Math.max(0, avgAll - avgEvening);
  const pricingPeriod = fareGap * eveningCompleted.length * PRICING_CAPTURE_RATE;

  const periodBase = leadRecoveryPeriod + zoneRebalancePeriod + pricingPeriod;
  const monthlyBase = periodBase * monthlyScale;

  const cap = period.monthlyRunRateEur * MONTHLY_CAP_PCT;
  const baseCaseEur = Math.round(Math.min(monthlyBase, cap));
  const bestCaseEur = Math.round(Math.min(monthlyBase * BEST_MULTIPLIER, cap));
  const worstCaseEur = Math.round(monthlyBase * WORST_MULTIPLIER);
  const annualBestCaseEur = bestCaseEur * 12;

  return {
    baseCaseEur,
    bestCaseEur,
    worstCaseEur,
    annualBestCaseEur,
    formula:
      "Monthly base = (lead recovery + zone rebalance + peak pricing) × (30/periodDays). " +
      "Best/worst = base × 1.28 / 0.72. Annual best = best × 12.",
    assumptions: [
      `${period.periodLabel} baseline; ${period.periodDays}-day revenue €${kpis.revenue.toLocaleString("en-EU")}`,
      `Lead recovery: ${lostLeads} lost leads × €${avgFare.toFixed(2)} avg fare × ${LEAD_CAPTURE_RATE * 100}% capture`,
      topZone
        ? `Zone rebalance: top zone ${topZone.zone} opportunity €${topZone.revenueOpportunity.toFixed(0)} × ${ZONE_CAPTURE_RATE * 100}%`
        : "Zone rebalance: no critical zone identified",
      `Peak pricing: fare gap €${fareGap.toFixed(2)} × ${eveningCompleted.length} evening rides × ${PRICING_CAPTURE_RATE * 100}%`,
      `Monthly cap: ${MONTHLY_CAP_PCT * 100}% of run-rate (€${period.monthlyRunRateEur.toLocaleString("en-EU")}/mo)`,
      "Subject to pilot validation — not a guaranteed outcome"
    ],
    confidencePct: 72
  };
}
