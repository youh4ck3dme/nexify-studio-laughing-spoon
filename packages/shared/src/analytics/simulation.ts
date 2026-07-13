import type {
  FleetKpis,
  OpportunityProjection,
  Recommendation,
  SimulationRequest,
  SimulationResponse,
  ThreeStepPlanItem,
  WaterfallItem
} from "../types.js";

const MAX_REVENUE_LIFT_PCT = 25;
const MAX_UTILIZATION_LIFT_PCT = 15;
const MAX_CONVERSION_LIFT_PCT = 20;

function applyIntensity(base: number, intensity: number): number {
  return base * (intensity / 100);
}

export function simulatePlan(
  req: SimulationRequest,
  recommendations: Recommendation[],
  opportunity?: OpportunityProjection
): SimulationResponse {
  const { baselineKpis, actions } = req;
  const recMap = new Map(recommendations.map((r) => [r.id, r]));

  let revenueLift = 0;
  let idleReduction = 0;
  let conversionLift = 0;
  const waterfall: WaterfallItem[] = [];
  let cumulative = baselineKpis.revenue;

  waterfall.push({
    label: "Current revenue",
    valueEur: baselineKpis.revenue,
    cumulativeEur: cumulative
  });

  for (const action of actions) {
    const rec = recMap.get(action.actionId);
    if (!rec) continue;

    const intensity = Math.min(100, Math.max(0, action.intensity));
    const lift = applyIntensity(rec.expectedRevenueLiftEur, intensity);
    revenueLift += lift;
    idleReduction += applyIntensity(rec.idleTimeReductionHours, intensity);
    conversionLift += applyIntensity(3, intensity);

    cumulative += lift;
    waterfall.push({
      label: rec.title.slice(0, 40),
      valueEur: Math.round(lift * 100) / 100,
      cumulativeEur: Math.round(cumulative * 100) / 100
    });
  }

  const maxRevenueLift = baselineKpis.revenue * (MAX_REVENUE_LIFT_PCT / 100);
  revenueLift = Math.min(revenueLift, maxRevenueLift);

  const projectedRevenue = baselineKpis.revenue + revenueLift;
  const projectedUtilization = Math.min(
    100,
    baselineKpis.utilizationPct + Math.min(MAX_UTILIZATION_LIFT_PCT, idleReduction * 0.5)
  );
  const projectedConversion = Math.min(
    100,
    baselineKpis.leadConversionPct + Math.min(MAX_CONVERSION_LIFT_PCT, conversionLift)
  );
  const projectedIdle = Math.max(0, baselineKpis.idleHours - idleReduction);
  const projectedLeakage = Math.max(0, baselineKpis.estimatedLeakageEur - revenueLift * 0.6);

  const projected: FleetKpis = {
    ...baselineKpis,
    revenue: Math.round(projectedRevenue * 100) / 100,
    utilizationPct: Math.round(projectedUtilization * 10) / 10,
    idleHours: Math.round(projectedIdle * 10) / 10,
    leadConversionPct: Math.round(projectedConversion * 10) / 10,
    estimatedLeakageEur: Math.round(projectedLeakage * 100) / 100,
    completedRides: baselineKpis.completedRides + Math.round(revenueLift / 15),
    trends: {
      revenue: {
        direction: "up",
        deltaPct: baselineKpis.revenue > 0 ? (revenueLift / baselineKpis.revenue) * 100 : 0
      },
      utilization: { direction: "up", deltaPct: projectedUtilization - baselineKpis.utilizationPct },
      conversion: { direction: "up", deltaPct: projectedConversion - baselineKpis.leadConversionPct },
      idleHours: {
        direction: "down",
        deltaPct:
          baselineKpis.idleHours > 0 ? (-idleReduction / baselineKpis.idleHours) * 100 : 0
      }
    }
  };

  const threeStepPlan: ThreeStepPlanItem[] = buildThreeStepPlan(recommendations.slice(0, 3));

  const defaultOpportunity: OpportunityProjection = {
    baseCaseEur: 0,
    bestCaseEur: 0,
    worstCaseEur: 0,
    annualBestCaseEur: 0,
    formula: "",
    assumptions: [],
    confidencePct: 0
  };

  return {
    current: baselineKpis,
    projected,
    waterfall,
    threeStepPlan,
    assumptions: [
      "Projections assume stable demand patterns over 30 days",
      `Revenue lift capped at +${MAX_REVENUE_LIFT_PCT}% of baseline period revenue`,
      "Intensity scales linearly — real-world response may be non-linear",
      "±15% uncertainty band not shown; treat as directional simulation",
      "Subject to pilot validation — not a guaranteed outcome"
    ],
    isSimulation: true,
    opportunity: opportunity ?? defaultOpportunity
  };
}

function buildThreeStepPlan(recs: Recommendation[]): ThreeStepPlanItem[] {
  const defaults: ThreeStepPlanItem[] = [
    { step: 1, title: "Rebalance vehicles tonight", timing: "Tonight by 22:00" },
    { step: 2, title: "Activate peak pricing tomorrow", timing: "Tomorrow 06:00" },
    { step: 3, title: "Contact high-intent leads within 15 minutes", timing: "Immediate SLA" }
  ];

  if (recs.length === 0) return defaults;

  const timings = ["Tonight by 22:00", "Tomorrow 06:00", "Immediate SLA"];
  return recs.slice(0, 3).map((rec, i) => ({
    step: i + 1,
    title: rec.title,
    timing: timings[i] ?? "Within 7 days"
  }));
}

export function simulateBestPlan(
  baselineKpis: FleetKpis,
  recommendations: Recommendation[],
  opportunity?: OpportunityProjection
): SimulationResponse {
  const best = recommendations.find((r) => r.isBestNextAction) ?? recommendations[0];
  const top3 = recommendations.slice(0, 3);

  const actions = top3.map((rec) => ({
    actionId: rec.id,
    intensity: rec.id === best?.id ? 100 : 70
  }));

  return simulatePlan({ baselineKpis, actions }, recommendations, opportunity);
}
