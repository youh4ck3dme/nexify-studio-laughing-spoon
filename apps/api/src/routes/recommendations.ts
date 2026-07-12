import { Router } from "express";
import type { RecommendationRequest } from "@fleet/shared";
import { buildRecommendationResponse } from "../fixtures/recommendations.js";
import {
  isPlainObject,
  sendValidationError,
  validateInputRows
} from "./validation.js";

export const recommendationsRouter = Router();

recommendationsRouter.post("/api/recommendations", (req, res) => {
  if (!isPlainObject(req.body)) {
    return sendValidationError(res, [
      {
        path: "body",
        message: "Body must be a JSON object."
      }
    ]);
  }

  const rides = req.body.rides ?? [];
  const leads = req.body.leads ?? [];

  const errors = [
    ...validateInputRows(rides, "rides"),
    ...validateInputRows(leads, "leads")
  ];

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const body = { rides, leads } as Required<RecommendationRequest>;
  return res.json(buildRecommendationResponse(body.rides.length, body.leads.length));
});
