import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.js";
import { recommendationsRouter } from "./routes/recommendations.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use(healthRouter);
app.use(recommendationsRouter);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

