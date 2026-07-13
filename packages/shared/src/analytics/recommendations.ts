import type { FleetKpis, LeadRow, Recommendation, RideRow, ZoneMetrics } from "../types.js";

const PEAK_HOURS = new Set([17, 18, 19]);

type RuleContext = {
  rides: RideRow[];
  leads: LeadRow[];
  kpis: FleetKpis;
  zones: ZoneMetrics[];
};

function scoreRecommendation(rec: Omit<Recommendation, "isBestNextAction">): number {
  return rec.confidenceScore * 0.4 + rec.expectedRevenueLiftEur * 0.001 + rec.idleTimeReductionHours * 2;
}

export function generateRecommendations(ctx: RuleContext): Recommendation[] {
  const { rides, leads, kpis, zones } = ctx;
  const candidates: Omit<Recommendation, "isBestNextAction">[] = [];

  const criticalZone = zones.find((z) => z.isCritical) ?? zones[0];
  const peakRides = rides.filter((r) => PEAK_HOURS.has(r.hourSlot));
  const peakByZone = new Map<string, number>();
  for (const r of peakRides) {
    peakByZone.set(r.zone, (peakByZone.get(r.zone) ?? 0) + 1);
  }
  const topPeakZone = [...peakByZone.entries()].sort((a, b) => b[1] - a[1])[0];

  if (criticalZone && topPeakZone) {
    const vehiclesToMove = Math.min(3, Math.ceil(criticalZone.demand / Math.max(criticalZone.supply, 1)));
    candidates.push({
      id: "rebalance-vehicles",
      title: `Rebalance ${vehiclesToMove} vehicles to Zone ${topPeakZone[0]} tonight`,
      explanation: `Peak demand in Zone ${topPeakZone[0]} exceeds available supply. Moving vehicles from underutilized zones reduces missed rides.`,
      dataEvidence: [
        `Zone ${topPeakZone[0]}: ${topPeakZone[1]} peak-hour ride requests`,
        `Demand/supply ratio ${(criticalZone.demand / Math.max(criticalZone.supply, 1)).toFixed(1)}x in critical zone`,
        `${criticalZone.idleCapacity.toFixed(0)} idle capacity units elsewhere`
      ],
      confidenceScore: 87,
      expectedRevenueLiftEur: Math.round(criticalZone.revenueOpportunity * 0.35),
      idleTimeReductionHours: Math.round(kpis.idleHours * 0.08 * 10) / 10,
      implementationDifficulty: "medium",
      risks: ["Temporary coverage gap in source zones", "Driver schedule disruption"],
      guardrails: ["Maintain minimum 2 vehicles per zone", "Notify drivers 4h ahead"]
    });
  }

  const eveningRides = rides.filter((r) => PEAK_HOURS.has(r.hourSlot) && r.status === "completed");
  const avgEveningFare =
    eveningRides.length > 0 ? eveningRides.reduce((s, r) => s + r.fare, 0) / eveningRides.length : 14;
  const allAvgFare =
    rides.filter((r) => r.status === "completed").reduce((s, r) => s + r.fare, 0) /
      Math.max(rides.filter((r) => r.status === "completed").length, 1);

  if (avgEveningFare < allAvgFare * 1.05) {
    const liftEur = Math.round(eveningRides.length * avgEveningFare * 0.1);
    candidates.push({
      id: "dynamic-pricing",
      title: "Activate +10% peak pricing in evening slots",
      explanation: "Evening demand is high but average fare is below fleet benchmark. Dynamic pricing captures willingness-to-pay without adding vehicles.",
      dataEvidence: [
        `${eveningRides.length} completed evening rides (17:00–19:00)`,
        `Avg evening fare €${avgEveningFare.toFixed(2)} vs fleet €${allAvgFare.toFixed(2)}`,
        `Utilization at ${kpis.utilizationPct}% — pricing safer than oversupply`
      ],
      confidenceScore: 82,
      expectedRevenueLiftEur: liftEur,
      idleTimeReductionHours: 0,
      implementationDifficulty: "low",
      risks: ["Customer price sensitivity", "Competitor undercutting"],
      guardrails: ["Cap surge at +15%", "Exclude loyalty tier A customers"]
    });
  }

  const tierALeads = leads.filter((l) => l.priority === "A" && l.status === "new");
  if (tierALeads.length >= 5) {
    const avgFare = kpis.revenue / Math.max(kpis.completedRides, 1);
    candidates.push({
      id: "lead-priority",
      title: "Contact high-intent Tier-A leads within 15 minutes",
      explanation: "Uncontacted Tier-A leads represent the fastest path to conversion lift. Speed-to-lead strongly correlates with booking rate.",
      dataEvidence: [
        `${tierALeads.length} Tier-A leads still in 'new' status`,
        `Current conversion ${kpis.leadConversionPct}% vs target ${kpis.targets.leadConversionPct}%`,
        `Estimated €${Math.round(tierALeads.length * avgFare * 0.25)} recoverable`
      ],
      confidenceScore: 91,
      expectedRevenueLiftEur: Math.round(tierALeads.length * avgFare * 0.25),
      idleTimeReductionHours: Math.round(kpis.idleHours * 0.03 * 10) / 10,
      implementationDifficulty: "low",
      risks: ["Agent capacity during peaks", "Duplicate outreach"],
      guardrails: ["Max 2 contact attempts per lead", "Auto-assign round-robin"]
    });
  }

  const underutilized = zones.filter((z) => z.utilizationPct < 55 && z.idleCapacity > 5);
  if (underutilized.length > 0) {
    const zone = underutilized[0];
    candidates.push({
      id: "schedule-shift",
      title: `Shift driver schedules to cover Zone ${zone.zone} off-peak gaps`,
      explanation: "Off-peak idle hours in high-opportunity zones suggest a schedule mismatch. Shifting 2-hour blocks aligns supply with demand curves.",
      dataEvidence: [
        `Zone ${zone.zone} utilization ${zone.utilizationPct}%`,
        `${zone.idleCapacity.toFixed(0)} idle capacity units`,
        `€${zone.revenueOpportunity.toFixed(0)} revenue opportunity identified`
      ],
      confidenceScore: 74,
      expectedRevenueLiftEur: Math.round(zone.revenueOpportunity * 0.2),
      idleTimeReductionHours: Math.round(kpis.idleHours * 0.12 * 10) / 10,
      implementationDifficulty: "high",
      risks: ["Driver fatigue", "Union/regulatory hour limits"],
      guardrails: ["Max 10h shifts", "Voluntary opt-in with bonus"]
    });
  }

  const cancelled = rides.filter((r) => r.status === "cancelled").length;
  const staleLeads = leads.filter((l) => l.status === "contacted").length;
  if (cancelled + staleLeads >= 10) {
    const avgFare = kpis.revenue / Math.max(kpis.completedRides, 1);
    candidates.push({
      id: "reactivation",
      title: "Reactivate lost customers with win-back offers",
      explanation: "Cancelled rides and contacted-but-unconverted leads are warm opportunities. Targeted win-back campaigns recover revenue at lower CAC than new acquisition.",
      dataEvidence: [
        `${cancelled} cancelled rides in dataset`,
        `${staleLeads} contacted leads without conversion`,
        `Win-back conversion benchmark: 12–18%`
      ],
      confidenceScore: 68,
      expectedRevenueLiftEur: Math.round((cancelled + staleLeads) * avgFare * 0.12),
      idleTimeReductionHours: Math.round(kpis.idleHours * 0.05 * 10) / 10,
      implementationDifficulty: "medium",
      risks: ["Brand discount perception", "Low response rate"],
      guardrails: ["One offer per customer per 30 days", "10% max discount"]
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      id: "baseline-optimize",
      title: "Review fleet KPIs and set weekly optimization targets",
      explanation: "Current data shows balanced operations. Focus on incremental gains through monitoring and small adjustments.",
      dataEvidence: [`${rides.length} rides analyzed`, `${leads.length} leads analyzed`],
      confidenceScore: 60,
      expectedRevenueLiftEur: Math.round(kpis.revenue * 0.05),
      idleTimeReductionHours: 2,
      implementationDifficulty: "low",
      risks: ["Analysis paralysis"],
      guardrails: ["Weekly review cadence"]
    });
  }

  const sorted = candidates.sort((a, b) => scoreRecommendation(b) - scoreRecommendation(a));
  const top3 = sorted.slice(0, 5);
  const bestId = top3[0]?.id;

  return top3.map((rec) => ({
    ...rec,
    isBestNextAction: rec.id === bestId
  }));
}
