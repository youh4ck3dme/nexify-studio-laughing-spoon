import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    service: "fleetrevenue-api",
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

