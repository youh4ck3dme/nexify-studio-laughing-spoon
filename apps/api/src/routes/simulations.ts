import { Router } from "express";
import type { SimulationRequest } from "@fleet/shared";
import { runSimulation } from "../services/simulatePlan.js";
import { isPlainObject, sendValidationError } from "./validation.js";

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

  const { actions, baselineKpis, recommendations } = req.body;

  if (!Array.isArray(actions)) {
    return sendValidationError(res, [
      { path: "actions", message: "actions must be an array." }
    ]);
  }

  if (!isPlainObject(baselineKpis)) {
    return sendValidationError(res, [
      { path: "baselineKpis", message: "baselineKpis must be an object." }
    ]);
  }

  if (!Array.isArray(recommendations)) {
    return sendValidationError(res, [
      { path: "recommendations", message: "recommendations must be an array." }
    ]);
  }

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    if (!isPlainObject(action) || typeof action.actionId !== "string") {
      return sendValidationError(res, [
        { path: `actions[${i}].actionId`, message: "actionId must be a string." }
      ]);
    }
    if (typeof action.intensity !== "number" || !Number.isFinite(action.intensity)) {
      return sendValidationError(res, [
        { path: `actions[${i}].intensity`, message: "intensity must be a finite number." }
      ]);
    }
  }

  const body = req.body as SimulationRequest & { recommendations: import("@fleet/shared").Recommendation[] };
  return res.json(runSimulation(
    { actions: body.actions, baselineKpis: body.baselineKpis as import("@fleet/shared").FleetKpis },
    body.recommendations
  ));
});
