export type {
  AnalysisResponse,
  ChartData,
  FleetKpis,
  ImplementationDifficulty,
  InputRow,
  KpiTrend,
  LeadFunnelStep,
  LeadRow,
  OpportunityProjection,
  PeriodContext,
  Recommendation,
  RecommendationRequest,
  RevenueByDay,
  RideRow,
  SimulationActionInput,
  SimulationRequest,
  SimulationResponse,
  ThreeStepPlanItem,
  UtilizationByZone,
  ValidationError,
  ValidationErrorResponse,
  WaterfallItem,
  ZoneMetrics
} from "./types.js";

export { analyzeFleet } from "./analytics/analyzeFleet.js";
export { normalizeLeadRows, normalizeRideRows } from "./analytics/normalize.js";
export { computeKpis, emptyKpis } from "./analytics/kpis.js";
export { computeOpportunityProjection } from "./analytics/opportunity.js";
export { buildPeriodContext, inferPeriodDaysFromRides } from "./analytics/period.js";
export { simulatePlan, simulateBestPlan } from "./analytics/simulation.js";
export { generateDemoFleet, demoFleetToCsv, mulberry32 } from "./demo/generateFleet.js";
export type { DemoFleet } from "./demo/generateFleet.js";

import type {
  AnalysisResponse,
  FleetKpis,
  OpportunityProjection,
  Recommendation,
  SimulationResponse
} from "./types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isInputRow = (value: unknown): value is import("./types.js").InputRow =>
  isRecord(value) && Object.values(value).every((field) => typeof field === "string");

export const isRecommendationRequest = (value: unknown): value is import("./types.js").RecommendationRequest => {
  if (!isRecord(value)) return false;
  if (value.rides !== undefined && (!Array.isArray(value.rides) || !value.rides.every(isInputRow))) return false;
  if (value.leads !== undefined && (!Array.isArray(value.leads) || !value.leads.every(isInputRow))) return false;
  return true;
};

const isKpiTrend = (value: unknown): boolean =>
  isRecord(value) &&
  (value.direction === "up" || value.direction === "down" || value.direction === "flat") &&
  typeof value.deltaPct === "number";

const isFleetKpis = (value: unknown): value is FleetKpis =>
  isRecord(value) &&
  typeof value.revenue === "number" &&
  typeof value.utilizationPct === "number" &&
  typeof value.idleHours === "number" &&
  typeof value.leadConversionPct === "number" &&
  typeof value.estimatedLeakageEur === "number" &&
  isRecord(value.trends) &&
  isKpiTrend(value.trends.revenue) &&
  isRecord(value.targets);

const isRecommendation = (value: unknown): value is Recommendation =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.confidenceScore === "number" &&
  Array.isArray(value.dataEvidence);

const isOpportunityProjection = (value: unknown): value is OpportunityProjection =>
  isRecord(value) &&
  typeof value.baseCaseEur === "number" &&
  typeof value.bestCaseEur === "number" &&
  typeof value.worstCaseEur === "number" &&
  typeof value.annualBestCaseEur === "number";

const isPeriodContext = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.periodDays === "number" &&
  typeof value.periodLabel === "string" &&
  typeof value.monthlyRunRateEur === "number";

export const isAnalysisResponse = (value: unknown): value is AnalysisResponse =>
  isRecord(value) &&
  typeof value.ridesImported === "number" &&
  typeof value.leadsImported === "number" &&
  isPeriodContext(value.period) &&
  isFleetKpis(value.kpis) &&
  Array.isArray(value.zones) &&
  Array.isArray(value.recommendations) &&
  value.recommendations.every(isRecommendation) &&
  isOpportunityProjection(value.opportunity) &&
  typeof value.executiveBrief === "string";

export const isSimulationResponse = (value: unknown): value is SimulationResponse =>
  isRecord(value) &&
  isFleetKpis(value.current) &&
  isFleetKpis(value.projected) &&
  Array.isArray(value.waterfall) &&
  Array.isArray(value.threeStepPlan) &&
  isOpportunityProjection(value.opportunity) &&
  value.isSimulation === true;
