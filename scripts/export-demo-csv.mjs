import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeFleet, demoFleetToCsv, generateDemoFleet } from "../packages/shared/dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "data", "samples");

mkdirSync(outDir, { recursive: true });

const fleet = generateDemoFleet(42);
const { ridesCsv, leadsCsv } = demoFleetToCsv(fleet);
const analysis = analyzeFleet(fleet.rides, fleet.leads);

writeFileSync(join(outDir, "rides-demo.csv"), ridesCsv, "utf8");
writeFileSync(join(outDir, "leads-demo.csv"), leadsCsv, "utf8");

console.log("Exported demo CSVs to data/samples/");
console.log(
  JSON.stringify(
    {
      revenue: analysis.kpis.revenue,
      utilizationPct: analysis.kpis.utilizationPct,
      opportunityBase: analysis.opportunity.baseCaseEur,
      opportunityBest: analysis.opportunity.bestCaseEur,
      annualBest: analysis.opportunity.annualBestCaseEur
    },
    null,
    2
  )
);
