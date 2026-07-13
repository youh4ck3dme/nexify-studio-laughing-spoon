import type { AnalysisResponse, FleetKpis, OpportunityProjection, PeriodContext, Recommendation } from "../types.js";

type BriefInput = Pick<AnalysisResponse, "kpis" | "recommendations" | "opportunity" | "period">;

export function buildExecutiveBrief(input: BriefInput): string {
  const best = input.recommendations.find((r) => r.isBestNextAction) ?? input.recommendations[0];
  const { kpis, opportunity, period } = input;

  if (!best) {
    return "Insufficient data for executive brief. Upload rides and leads CSV files to generate insights.";
  }

  return `EXECUTIVE BRIEF — FleetRevenue AI

SITUATION (${period.periodLabel})
Fleet generated €${kpis.revenue.toLocaleString("en-EU")} in revenue across ${kpis.completedRides} completed rides. Utilization: ${kpis.utilizationPct}% (target ${kpis.targets.utilizationPct}%). Estimated leakage: €${kpis.estimatedLeakageEur.toLocaleString("en-EU")} over the baseline period.

WHY
Lead conversion at ${kpis.leadConversionPct}% trails the ${kpis.targets.leadConversionPct}% target. ${kpis.idleHours.toFixed(0)} idle vehicle-hours indicate supply-demand misalignment across zones.

RECOMMENDED ACTION
${best.title} — ${best.explanation}

MODELED IMPACT (subject to pilot validation)
Base-case monthly upside: €${opportunity.baseCaseEur.toLocaleString("en-EU")}/mo
Range: €${opportunity.worstCaseEur.toLocaleString("en-EU")} – €${opportunity.bestCaseEur.toLocaleString("en-EU")}/mo
Annual best-case (×12): up to €${opportunity.annualBestCaseEur.toLocaleString("en-EU")}/yr
Primary action lift: +€${best.expectedRevenueLiftEur.toLocaleString("en-EU")} over baseline period, confidence ${best.confidenceScore}%.

RISKS
${best.risks.join("; ")}.

7-DAY PLAN
Day 1–2: Execute ${best.title.includes("Rebalance") ? "vehicle rebalancing" : "top-priority initiative"}.
Day 3–4: Activate secondary recommendations (pricing, lead SLA).
Day 5–7: Measure KPI shift vs baseline, adjust intensity, report to ops team.`;
}

export function buildWhyExplanation(input: BriefInput): string {
  const best = input.recommendations.find((r) => r.isBestNextAction) ?? input.recommendations[0];
  if (!best) return "No recommendations generated.";

  const { opportunity, period } = input;

  return `HOW OPPORTUNITY WAS CALCULATED

${opportunity.formula}

Baseline: ${period.periodLabel} · Monthly run-rate €${period.monthlyRunRateEur.toLocaleString("en-EU")}

Scenarios:
- Base case: €${opportunity.baseCaseEur.toLocaleString("en-EU")}/mo
- Best case: €${opportunity.bestCaseEur.toLocaleString("en-EU")}/mo (×1.28, capped at 55% of run-rate)
- Worst case: €${opportunity.worstCaseEur.toLocaleString("en-EU")}/mo (×0.72)
- Annual best-case: €${opportunity.annualBestCaseEur.toLocaleString("en-EU")}/yr (best × 12, not guaranteed)

Assumptions:
${opportunity.assumptions.map((a) => `• ${a}`).join("\n")}

Best action "${best.title}": confidence ${best.confidenceScore}%, period lift €${best.expectedRevenueLiftEur}.
Evidence: ${best.dataEvidence.join(" | ")}

Confidence: ${opportunity.confidencePct}%. All figures are deterministic simulations — subject to pilot validation.`;
}

export type { BriefInput };
