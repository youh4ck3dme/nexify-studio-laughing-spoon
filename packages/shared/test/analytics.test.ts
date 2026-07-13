import { describe, expect, it } from "vitest";
import { analyzeFleet } from "../src/analytics/analyzeFleet.js";
import { computeKpis } from "../src/analytics/kpis.js";
import { generateRecommendations } from "../src/analytics/recommendations.js";
import { computeZones } from "../src/analytics/zones.js";
import { generateDemoFleet } from "../src/demo/generateFleet.js";
import type { LeadRow, RideRow } from "../src/types.js";

const sampleRides: RideRow[] = [
  { rideId: "r1", zone: "A", hourSlot: 17, fare: 14.5, driverId: "d1", status: "completed", timestamp: "2026-07-12" },
  { rideId: "r2", zone: "A", hourSlot: 18, fare: 11.0, driverId: "d2", status: "completed", timestamp: "2026-07-12" },
  { rideId: "r3", zone: "A", hourSlot: 19, fare: 16.2, driverId: "d1", status: "cancelled", timestamp: "2026-07-12" },
  { rideId: "r4", zone: "C", hourSlot: 10, fare: 9.0, driverId: "d3", status: "completed", timestamp: "2026-07-13" }
];

const sampleLeads: LeadRow[] = [
  { leadId: "l1", source: "web", priority: "A", createdAt: "2026-07-12", status: "new" },
  { leadId: "l2", source: "phone", priority: "B", createdAt: "2026-07-12", status: "contacted" },
  { leadId: "l3", source: "partner", priority: "A", createdAt: "2026-07-12", status: "converted" }
];

describe("analytics", () => {
  it("computes revenue from completed rides only", () => {
    const kpis = computeKpis(sampleRides, sampleLeads);
    expect(kpis.revenue).toBe(34.5);
    expect(kpis.completedRides).toBe(3);
  });

  it("computes lead conversion rate", () => {
    const kpis = computeKpis(sampleRides, sampleLeads);
    expect(kpis.leadConversionPct).toBeCloseTo(33.3, 0);
  });

  it("estimates leakage as positive when idle and lost leads exist", () => {
    const kpis = computeKpis(sampleRides, sampleLeads);
    expect(kpis.estimatedLeakageEur).toBeGreaterThan(0);
  });

  it("identifies zones with metrics", () => {
    const zones = computeZones(sampleRides);
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0]).toHaveProperty("revenueOpportunity");
  });

  it("generates at least one recommendation from sample data", () => {
    const kpis = computeKpis(sampleRides, sampleLeads);
    const zones = computeZones(sampleRides);
    const recs = generateRecommendations({ rides: sampleRides, leads: sampleLeads, kpis, zones });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => r.isBestNextAction)).toBe(true);
  });

  it("analyzeFleet returns full AnalysisResponse from InputRows", () => {
    const result = analyzeFleet(
      [
        { ride_id: "r1", zone: "A", hour_slot: "17", fare: "14.5", driver_id: "d1", status: "completed" }
      ],
      [{ lead_id: "l1", source: "web", priority: "A", created_at: "2026-07-12", status: "new" }]
    );
    expect(result.ridesImported).toBe(1);
    expect(result.leadsImported).toBe(1);
    expect(result.kpis.revenue).toBe(14.5);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.executiveBrief).toContain("EXECUTIVE BRIEF");
    expect(result.period.periodDays).toBeGreaterThan(0);
    expect(result.opportunity.baseCaseEur).toBeGreaterThanOrEqual(0);
  });

  it("handles empty data without crashing", () => {
    const result = analyzeFleet([], []);
    expect(result.ridesImported).toBe(0);
    expect(result.recommendations).toEqual([]);
  });

  it("demo seed 42 utilization is in realistic struggling-fleet range", () => {
    const fleet = generateDemoFleet(42);
    const analysis = analyzeFleet(fleet.rides, fleet.leads);
    expect(analysis.kpis.utilizationPct).toBeGreaterThan(40);
    expect(analysis.kpis.utilizationPct).toBeLessThan(65);
    expect(analysis.kpis.utilizationPct).toBe(47.7);
  });
});
