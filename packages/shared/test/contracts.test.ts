import { describe, expect, it } from "vitest";
import { simulateBestPlan } from "../src/analytics/simulation.js";
import {
  analyzeFleet,
  generateDemoFleet,
  isAnalysisResponse,
  isInputRow,
  isRecommendationRequest,
  isSimulationResponse
} from "../src/index";

describe("shared contracts", () => {
  describe("isInputRow", () => {
    it("accepts string-only records", () => {
      expect(isInputRow({ ride_id: "r1", zone: "A" })).toBe(true);
    });

    it("rejects non-string fields", () => {
      expect(isInputRow({ ride_id: 42 })).toBe(false);
    });
  });

  describe("isRecommendationRequest", () => {
    it("accepts empty and populated requests", () => {
      expect(isRecommendationRequest({})).toBe(true);
      expect(
        isRecommendationRequest({
          rides: [{ ride_id: "r1", zone: "A" }],
          leads: [{ lead_id: "l1", priority: "A" }]
        })
      ).toBe(true);
    });
  });

  describe("isAnalysisResponse", () => {
    it("accepts valid analysis from demo fleet", () => {
      const fleet = generateDemoFleet(42);
      const analysis = analyzeFleet(fleet.rides, fleet.leads);
      expect(isAnalysisResponse(analysis)).toBe(true);
    });
  });

  describe("isSimulationResponse", () => {
    it("accepts valid simulation shape", () => {
      const fleet = generateDemoFleet(42);
      const analysis = analyzeFleet(fleet.rides, fleet.leads);
      const sim = simulateBestPlan(analysis.kpis, analysis.recommendations, analysis.opportunity);
      expect(isSimulationResponse(sim)).toBe(true);
    });
  });
});
