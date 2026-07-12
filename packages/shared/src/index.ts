export type RecommendationAction = {
  id: string;
  title: string;
  expectedImpact: string;
};

export type RecommendationSummary = {
  ridesImported: number;
  leadsImported: number;
  estimatedRevenueLiftPct: number;
  estimatedIdleTimeDropPct: number;
  estimatedLeadConversionLiftPct: number;
};

export type RecommendationResponse = {
  summary: RecommendationSummary;
  actions: RecommendationAction[];
};

