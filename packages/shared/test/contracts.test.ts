import { describe, expect, it } from "vitest";
import {
  isInputRow,
  isRecommendationAction,
  isRecommendationRequest,
  isRecommendationResponse,
  isRecommendationSummary
} from "../src/index";

describe("shared contracts", () => {
  describe("isInputRow", () => {
    it("accepts string-only records", () => {
      expect(isInputRow({ ride_id: "r1", zone: "A" })).toBe(true);
    });

    it("rejects non-object values and non-string fields", () => {
      expect(isInputRow(null)).toBe(false);
      expect(isInputRow(["value"])).toBe(false);
      expect(isInputRow({ ride_id: 42 })).toBe(false);
    });
  });

  describe("isRecommendationRequest", () => {
    it("accepts empty and fully-populated requests", () => {
      expect(isRecommendationRequest({})).toBe(true);
      expect(
        isRecommendationRequest({
          rides: [{ ride_id: "r1", zone: "A" }],
          leads: [{ lead_id: "l1", priority: "A" }]
        })
      ).toBe(true);
    });

    it("rejects invalid list types and row values", () => {
      expect(isRecommendationRequest({ rides: "invalid" })).toBe(false);
      expect(isRecommendationRequest({ leads: [{ lead_id: "l1", score: 10 }] })).toBe(false);
    });
  });

  describe("isRecommendationAction", () => {
    it("requires all action fields", () => {
      expect(
        isRecommendationAction({
          id: "dispatch-peak-zones",
          title: "Reallocate vehicles",
          expectedImpact: "+7% completed rides in peak window"
        })
      ).toBe(true);

      expect(
        isRecommendationAction({
          id: "dispatch-peak-zones",
          title: "Reallocate vehicles"
        })
      ).toBe(false);
    });
  });

  describe("isRecommendationSummary", () => {
    it("accepts finite numeric summary metrics", () => {
      expect(
        isRecommendationSummary({
          ridesImported: 2,
          leadsImported: 1,
          estimatedRevenueLiftPct: 11.8,
          estimatedIdleTimeDropPct: 9.4,
          estimatedLeadConversionLiftPct: 13.1
        })
      ).toBe(true);
    });

    it("rejects non-finite and missing metrics", () => {
      expect(
        isRecommendationSummary({
          ridesImported: Number.NaN,
          leadsImported: 1,
          estimatedRevenueLiftPct: 11.8,
          estimatedIdleTimeDropPct: 9.4,
          estimatedLeadConversionLiftPct: 13.1
        })
      ).toBe(false);

      expect(
        isRecommendationSummary({
          ridesImported: 2,
          leadsImported: 1,
          estimatedRevenueLiftPct: 11.8,
          estimatedIdleTimeDropPct: 9.4
        })
      ).toBe(false);
    });
  });

  describe("isRecommendationResponse", () => {
    it("accepts valid response shapes", () => {
      expect(
        isRecommendationResponse({
          summary: {
            ridesImported: 2,
            leadsImported: 2,
            estimatedRevenueLiftPct: 11.8,
            estimatedIdleTimeDropPct: 9.4,
            estimatedLeadConversionLiftPct: 13.1
          },
          actions: []
        })
      ).toBe(true);
    });

    it("rejects invalid nested fields", () => {
      expect(
        isRecommendationResponse({
          summary: {
            ridesImported: 2,
            leadsImported: "2",
            estimatedRevenueLiftPct: 11.8,
            estimatedIdleTimeDropPct: 9.4,
            estimatedLeadConversionLiftPct: 13.1
          },
          actions: []
        })
      ).toBe(false);

      expect(
        isRecommendationResponse({
          summary: {
            ridesImported: 2,
            leadsImported: 2,
            estimatedRevenueLiftPct: 11.8,
            estimatedIdleTimeDropPct: 9.4,
            estimatedLeadConversionLiftPct: 13.1
          },
          actions: [{ id: "a-1", title: "Action without impact" }]
        })
      ).toBe(false);
    });
  });
});
