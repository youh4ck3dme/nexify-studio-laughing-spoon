import { Router } from "express";
import type { SimulationRequest } from "@fleet/shared";
import { buildSimulationResponse, recommendationActions } from "../fixtures/recommendations.js";
import { isPlainObject, sendValidationError } from "./validation.js";

const actionIds = new Set(recommendationActions.map((action) => action.id));

export const simulationsRouter = Router();

simulationsRouter.post("/api/simulations", (req, res) => {
  if (!isPlainObject(req.body)) {
    return sendValidationError(res, [
      {
        path: "body",
        message: "Body must be a JSON object."
      }
    ]);
  }

  const { actionId } = req.body;

  if (typeof actionId !== "string") {
    return sendValidationError(res, [
      {
        path: "actionId",
        message: "actionId must be a string."
      }
    ]);
  }

  if (!actionIds.has(actionId)) {
    return sendValidationError(res, [
      {
        path: "actionId",
        message: `actionId must be one of: ${[...actionIds].join(", ")}.`
      }
    ]);
  }

  const body = req.body as SimulationRequest;
  return res.json(buildSimulationResponse(body.actionId));
});
