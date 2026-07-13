export type InputRow = Record<string, string>;

export type RideRow = {
  rideId: string;
  zone: string;
  hourSlot: number;
  fare: number;
  driverId: string;
  status: string;
  timestamp?: string;
};

export type LeadRow = {
  leadId: string;
  source: string;
  priority: string;
  createdAt: string;
  status: string;
};

export type KpiTrend = {
  direction: "up" | "down" | "flat";
  deltaPct: number;
};

export type FleetKpis = {
  revenue: number;
  utilizationPct: number;
  idleHours: number;
  leadConversionPct: number;
  estimatedLeakageEur: number;
  completedRides: number;
  trends: {
    revenue: KpiTrend;
    utilization: KpiTrend;
    conversion: KpiTrend;
    idleHours: KpiTrend;
  };
  targets: {
    revenue: number;
    utilizationPct: number;
    leadConversionPct: number;
    idleHours: number;
    leakageEur: number;
  };
};

export type ZoneMetrics = {
  zone: string;
  demand: number;
  supply: number;
  idleCapacity: number;
  revenueOpportunity: number;
  utilizationPct: number;
  isCritical: boolean;
  explanation: string;
};

export type RevenueByDay = { date: string; revenue: number };
export type UtilizationByZone = { zone: string; utilizationPct: number };
export type LeadFunnelStep = { stage: string; count: number; pct: number };

export type ChartData = {
  revenueByDay: RevenueByDay[];
  utilizationByZone: UtilizationByZone[];
  leadFunnel: LeadFunnelStep[];
};

export type ImplementationDifficulty = "low" | "medium" | "high";

export type Recommendation = {
  id: string;
  title: string;
  explanation: string;
  dataEvidence: string[];
  confidenceScore: number;
  expectedRevenueLiftEur: number;
  idleTimeReductionHours: number;
  implementationDifficulty: ImplementationDifficulty;
  risks: string[];
  guardrails: string[];
  isBestNextAction?: boolean;
};

export type PeriodContext = {
  periodDays: number;
  periodLabel: string;
  monthlyRunRateEur: number;
};

export type OpportunityProjection = {
  baseCaseEur: number;
  bestCaseEur: number;
  worstCaseEur: number;
  annualBestCaseEur: number;
  formula: string;
  assumptions: string[];
  confidencePct: number;
};

export type AnalysisResponse = {
  ridesImported: number;
  leadsImported: number;
  period: PeriodContext;
  kpis: FleetKpis;
  zones: ZoneMetrics[];
  charts: ChartData;
  recommendations: Recommendation[];
  opportunity: OpportunityProjection;
  executiveBrief: string;
  whyExplanation: string;
};

export type RecommendationRequest = {
  rides?: InputRow[];
  leads?: InputRow[];
};

export type SimulationActionInput = {
  actionId: string;
  intensity: number;
};

export type SimulationRequest = {
  actions: SimulationActionInput[];
  baselineKpis: FleetKpis;
};

export type WaterfallItem = {
  label: string;
  valueEur: number;
  cumulativeEur: number;
};

export type ThreeStepPlanItem = {
  step: number;
  title: string;
  timing: string;
};

export type SimulationResponse = {
  current: FleetKpis;
  projected: FleetKpis;
  waterfall: WaterfallItem[];
  threeStepPlan: ThreeStepPlanItem[];
  assumptions: string[];
  isSimulation: true;
  opportunity: OpportunityProjection;
};

export type ValidationError = {
  path: string;
  message: string;
};

export type ValidationErrorResponse = {
  error: "validation_failed";
  details: ValidationError[];
};
