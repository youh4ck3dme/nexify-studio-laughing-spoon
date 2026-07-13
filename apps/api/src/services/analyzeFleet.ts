import { analyzeFleet } from "@fleet/shared";
import type { InputRow } from "@fleet/shared";

export function runAnalysis(rides: InputRow[], leads: InputRow[]) {
  return analyzeFleet(rides, leads);
}
