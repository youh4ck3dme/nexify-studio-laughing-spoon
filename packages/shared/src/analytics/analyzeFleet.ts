import type { AnalysisResponse, InputRow, RideRow } from "../types.js";
import { computeCharts } from "./charts.js";
import { buildExecutiveBrief, buildWhyExplanation } from "./executiveBrief.js";
import { computeKpis, emptyKpis } from "./kpis.js";
import { normalizeLeadRows, normalizeRideRows } from "./normalize.js";
import { computeOpportunityProjection } from "./opportunity.js";
import { buildPeriodContext } from "./period.js";
import { generateRecommendations } from "./recommendations.js";
import { computeZones } from "./zones.js";

const emptyOpportunity = {
  baseCaseEur: 0,
  bestCaseEur: 0,
  worstCaseEur: 0,
  annualBestCaseEur: 0,
  formula: "",
  assumptions: [],
  confidencePct: 0
};

const emptyPeriod = {
  periodDays: 28,
  periodLabel: "No data",
  monthlyRunRateEur: 0
};

export function analyzeFleet(rides: InputRow[], leads: InputRow[]): AnalysisResponse {
  const normalizedRides = normalizeRideRows(rides);
  const normalizedLeads = normalizeLeadRows(leads);

  if (normalizedRides.length === 0 && normalizedLeads.length === 0) {
    return emptyAnalysisResponse();
  }

  const kpis =
    normalizedRides.length > 0
      ? computeKpis(normalizedRides, normalizedLeads)
      : {
          ...emptyKpis(),
          leadConversionPct:
            normalizedLeads.length > 0
              ? computeKpis([], normalizedLeads).leadConversionPct
              : 0
        };

  const period = buildPeriodContext(normalizedRides, kpis.revenue);
  const zones = normalizedRides.length > 0 ? computeZones(normalizedRides) : [];
  const charts = computeCharts(normalizedRides, normalizedLeads);
  const recommendations = generateRecommendations({
    rides: normalizedRides,
    leads: normalizedLeads,
    kpis,
    zones
  });

  const opportunity = computeOpportunityProjection({
    rides: normalizedRides,
    leads: normalizedLeads,
    kpis,
    zones,
    period
  });

  const partial = { kpis, recommendations, opportunity, period };
  const executiveBrief = buildExecutiveBrief(partial);
  const whyExplanation = buildWhyExplanation(partial);

  return {
    ridesImported: rides.length,
    leadsImported: leads.length,
    period,
    kpis,
    zones,
    charts,
    recommendations,
    opportunity,
    executiveBrief,
    whyExplanation
  };
}

function emptyAnalysisResponse(): AnalysisResponse {
  return {
    ridesImported: 0,
    leadsImported: 0,
    period: emptyPeriod,
    kpis: emptyKpis(),
    zones: [],
    charts: { revenueByDay: [], utilizationByZone: [], leadFunnel: [] },
    recommendations: [],
    opportunity: emptyOpportunity,
    executiveBrief: "No data imported. Load demo fleet or upload CSV files to begin analysis.",
    whyExplanation: "No data available for explanation."
  };
}
