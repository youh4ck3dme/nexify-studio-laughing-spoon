export type InputRow = Record<string, string>;

export type RecommendationRequest = {
  rides?: InputRow[];
  leads?: InputRow[];
};

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isInputRow = (value: unknown): value is InputRow =>
  isRecord(value) && Object.values(value).every((field) => typeof field === "string");

export const isRecommendationRequest = (value: unknown): value is RecommendationRequest => {
  if (!isRecord(value)) {
    return false;
  }

  if (value.rides !== undefined) {
    if (!Array.isArray(value.rides) || !value.rides.every(isInputRow)) {
      return false;
    }
  }

  if (value.leads !== undefined) {
    if (!Array.isArray(value.leads) || !value.leads.every(isInputRow)) {
      return false;
    }
  }

  return true;
};

export const isRecommendationAction = (value: unknown): value is RecommendationAction =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.expectedImpact === "string";

export const isRecommendationSummary = (value: unknown): value is RecommendationSummary =>
  isRecord(value) &&
  typeof value.ridesImported === "number" &&
  Number.isFinite(value.ridesImported) &&
  typeof value.leadsImported === "number" &&
  Number.isFinite(value.leadsImported) &&
  typeof value.estimatedRevenueLiftPct === "number" &&
  Number.isFinite(value.estimatedRevenueLiftPct) &&
  typeof value.estimatedIdleTimeDropPct === "number" &&
  Number.isFinite(value.estimatedIdleTimeDropPct) &&
  typeof value.estimatedLeadConversionLiftPct === "number" &&
  Number.isFinite(value.estimatedLeadConversionLiftPct);

export const isRecommendationResponse = (value: unknown): value is RecommendationResponse =>
  isRecord(value) &&
  isRecommendationSummary(value.summary) &&
  Array.isArray(value.actions) &&
  value.actions.every(isRecommendationAction);
