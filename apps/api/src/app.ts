import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.js";
import { recommendationsRouter } from "./routes/recommendations.js";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.use(healthRouter);
  app.use(recommendationsRouter);

  return app;
};
