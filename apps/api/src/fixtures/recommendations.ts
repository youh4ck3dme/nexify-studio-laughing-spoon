import type {
  ProjectionSummary,
  RecommendationAction,
  RecommendationResponse,
  SimulationResponse
} from "@fleet/shared";

const baseProjection: ProjectionSummary = {
  estimatedRevenueLiftPct: 11.8,
  estimatedIdleTimeDropPct: 9.4,
  estimatedLeadConversionLiftPct: 13.1
};

export const recommendationActions: RecommendationAction[] = [
  {
    id: "dispatch-peak-zones",
    title: "Reallocate 3 vehicles to Zone A between 17:00-19:00",
    expectedImpact: "+7% completed rides in peak window"
  },
  {
    id: "pricing-evening-boost",
    title: "Apply +12% dynamic price multiplier in downtown peak",
    expectedImpact: "+9% revenue in evening slots"
  },
  {
    id: "lead-priority-tier-a",
    title: "Call Tier-A leads in first 15 minutes",
    expectedImpact: "+13% lead-to-ride conversion"
  }
];

const simulationProjections: Record<RecommendationAction["id"], ProjectionSummary> = {
  "dispatch-peak-zones": {
    estimatedRevenueLiftPct: 12.6,
    estimatedIdleTimeDropPct: 12.1,
    estimatedLeadConversionLiftPct: 13.1
  },
  "pricing-evening-boost": {
    estimatedRevenueLiftPct: 14.2,
    estimatedIdleTimeDropPct: 9.4,
    estimatedLeadConversionLiftPct: 13.1
  },
  "lead-priority-tier-a": {
    estimatedRevenueLiftPct: 11.8,
    estimatedIdleTimeDropPct: 9.4,
    estimatedLeadConversionLiftPct: 15.8
  }
};

export function buildRecommendationResponse(
  ridesImported: number,
  leadsImported: number
): RecommendationResponse {
  return {
    summary: {
      ridesImported,
      leadsImported,
      ...baseProjection
    },
    actions: recommendationActions
  };
}

export function buildSimulationResponse(
  actionId: RecommendationAction["id"]
): SimulationResponse {
  const appliedAction = recommendationActions.find((action) => action.id === actionId);

  if (!appliedAction) {
    throw new Error(`Unknown action ID: ${actionId}`);
  }

  return {
    actionId,
    appliedAction,
    projectedSummary: simulationProjections[actionId]
  };
}