import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { healthRouter } from "./routes/health.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { simulationsRouter } from "./routes/simulations.js";
import { sendValidationError } from "./routes/validation.js";

const jsonParseErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    sendValidationError(res, [
      {
        path: "body",
        message: "Body must be valid JSON."
      }
    ]);
    return;
  }

  next(error);
};

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.use(healthRouter);
  app.use(recommendationsRouter);
  app.use(simulationsRouter);
  app.use(jsonParseErrorHandler);

  return app;
}

export const app = createApp();
