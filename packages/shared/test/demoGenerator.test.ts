import { describe, expect, it } from "vitest";
import { analyzeFleet } from "../src/analytics/analyzeFleet.js";
import { generateDemoFleet } from "../src/demo/generateFleet.js";

describe("generateDemoFleet", () => {
  it("generates exactly 500 rides and 150 leads", () => {
    const fleet = generateDemoFleet(42);
    expect(fleet.rides).toHaveLength(500);
    expect(fleet.leads).toHaveLength(150);
  });

  it("is deterministic for the same seed", () => {
    const a = generateDemoFleet(42);
    const b = generateDemoFleet(42);
    expect(a.rides[0]).toEqual(b.rides[0]);
    expect(a.leads[99]).toEqual(b.leads[99]);
  });

  it("produces different data for different seeds", () => {
    const a = generateDemoFleet(42);
    const b = generateDemoFleet(99);
    expect(a.rides[0]?.fare).not.toBe(b.rides[0]?.fare);
  });

  it("demo fleet produces valid analysis with recommendations", () => {
    const fleet = generateDemoFleet(42);
    const analysis = analyzeFleet(fleet.rides, fleet.leads);
    expect(analysis.ridesImported).toBe(500);
    expect(analysis.leadsImported).toBe(150);
    expect(analysis.kpis.revenue).toBeGreaterThan(0);
    expect(analysis.kpis.utilizationPct).toBeGreaterThan(40);
    expect(analysis.kpis.utilizationPct).toBeLessThan(65);
    expect(analysis.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(analysis.opportunity.baseCaseEur).toBeGreaterThan(0);
  });
});
