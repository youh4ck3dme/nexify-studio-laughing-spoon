import { describe, expect, it } from "vitest";
import { analyzeFleet, generateDemoFleet } from "../src/index";

describe("demo opportunity projection", () => {
  it("computes credible base/best/worst monthly upside for seed 42 demo fleet", () => {
    const fleet = generateDemoFleet(42);
    const analysis = analyzeFleet(fleet.rides, fleet.leads);
    const { opportunity: opp } = analysis;

    expect(opp.baseCaseEur).toBeGreaterThan(2250);
    expect(opp.baseCaseEur).toBeLessThan(2500);
    expect(opp.bestCaseEur).toBeLessThan(3200);
    expect(opp.worstCaseEur).toBeGreaterThan(1600);
    expect(opp.annualBestCaseEur).toBe(opp.bestCaseEur * 12);

    expect(opp.baseCaseEur).toBe(2297);
    expect(opp.bestCaseEur).toBe(2940);
    expect(opp.worstCaseEur).toBe(1654);
    expect(opp.annualBestCaseEur).toBe(35280);
  });
});
