import { Router } from "express";
import {
  isInputRow,
  type RecommendationRequest,
  type RecommendationResponse
} from "@fleet/shared";

export const recommendationsRouter = Router();

recommendationsRouter.post("/api/recommendations", (req, res) => {
  const body = req.body as RecommendationRequest;
  const rides = Array.isArray(body.rides) && body.rides.every(isInputRow) ? body.rides : [];
  const leads = Array.isArray(body.leads) && body.leads.every(isInputRow) ? body.leads : [];
  const ridesCount = rides.length;
  const leadsCount = leads.length;

  const response: RecommendationResponse = {
    summary: {
      ridesImported: ridesCount,
      leadsImported: leadsCount,
      estimatedRevenueLiftPct: 11.8,
      estimatedIdleTimeDropPct: 9.4,
      estimatedLeadConversionLiftPct: 13.1
    },
    actions: [
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
    ]
  };

  res.json(response);
});
