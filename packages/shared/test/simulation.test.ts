import { describe, expect, it } from "vitest";
import { analyzeFleet } from "../src/analytics/analyzeFleet.js";
import { simulatePlan, simulateBestPlan } from "../src/analytics/simulation.js";
import { generateDemoFleet } from "../src/demo/generateFleet.js";

describe("simulation", () => {
  const fleet = generateDemoFleet(42);
  const analysis = analyzeFleet(fleet.rides, fleet.leads);

  it("projects higher revenue when actions applied at full intensity", () => {
    const best = analysis.recommendations.find((r) => r.isBestNextAction)!;
    const result = simulatePlan(
      {
        baselineKpis: analysis.kpis,
        actions: [{ actionId: best.id, intensity: 100 }]
      },
      analysis.recommendations
    );
    expect(result.projected.revenue).toBeGreaterThan(result.current.revenue);
    expect(result.isSimulation).toBe(true);
  });

  it("caps revenue lift at 25% of baseline", () => {
    const actions = analysis.recommendations.map((r) => ({ actionId: r.id, intensity: 100 }));
    const result = simulatePlan({ baselineKpis: analysis.kpis, actions }, analysis.recommendations);
    const maxLift = analysis.kpis.revenue * 0.25;
    expect(result.projected.revenue - result.current.revenue).toBeLessThanOrEqual(maxLift + 1);
  });

  it("zero intensity produces no change", () => {
    const best = analysis.recommendations[0];
    const result = simulatePlan(
      {
        baselineKpis: analysis.kpis,
        actions: [{ actionId: best.id, intensity: 0 }]
      },
      analysis.recommendations
    );
    expect(result.projected.revenue).toBe(result.current.revenue);
  });

  it("simulateBestPlan returns three-step plan", () => {
    const result = simulateBestPlan(analysis.kpis, analysis.recommendations);
    expect(result.threeStepPlan).toHaveLength(3);
    expect(result.waterfall.length).toBeGreaterThan(0);
    expect(result.assumptions.length).toBeGreaterThan(0);
  });
});
