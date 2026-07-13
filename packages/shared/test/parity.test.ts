import { describe, expect, it } from "vitest";
import { analyzeFleet } from "../src/analytics/analyzeFleet.js";
import { generateDemoFleet } from "../src/demo/generateFleet.js";

describe("parity", () => {
  it("produces identical analysis on repeated calls", () => {
    const fleet = generateDemoFleet(42);
    const a = analyzeFleet(fleet.rides, fleet.leads);
    const b = analyzeFleet(fleet.rides, fleet.leads);
    expect(a.kpis).toEqual(b.kpis);
    expect(a.opportunity).toEqual(b.opportunity);
    expect(a.recommendations.map((r) => r.id)).toEqual(b.recommendations.map((r) => r.id));
  });
});
