import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  analyzeFleet,
  generateDemoFleet,
  isAnalysisResponse,
  isSimulationResponse,
  simulateBestPlan
} from "@fleet/shared";
import { createApp } from "../src/app.js";

describe("API routes", () => {
  const app = createApp();

  it("returns health metadata with ISO timestamp", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      service: "fleetrevenue-api",
      status: "ok"
    });
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });

  it("returns AnalysisResponse for populated request payloads", async () => {
    const response = await request(app)
      .post("/api/recommendations")
      .send({
        rides: [
          { ride_id: "r1", zone: "A", hour_slot: "17", fare: "14.5", driver_id: "d1", status: "completed" },
          { ride_id: "r2", zone: "B", hour_slot: "18", fare: "11.0", driver_id: "d2", status: "completed" }
        ],
        leads: [{ lead_id: "l1", source: "web", priority: "A", status: "new" }]
      });

    expect(response.status).toBe(200);
    expect(isAnalysisResponse(response.body)).toBe(true);
    expect(response.body.ridesImported).toBe(2);
    expect(response.body.leadsImported).toBe(1);
    expect(response.body.kpis.revenue).toBeGreaterThan(0);
    expect(response.body.recommendations.length).toBeGreaterThan(0);
  });

  it("handles empty request lists", async () => {
    const response = await request(app).post("/api/recommendations").send({});

    expect(response.status).toBe(200);
    expect(isAnalysisResponse(response.body)).toBe(true);
    expect(response.body.ridesImported).toBe(0);
    expect(response.body.leadsImported).toBe(0);
  });

  it("handles demo-sized payload consistently", async () => {
    const fleet = generateDemoFleet(42);
    const response = await request(app)
      .post("/api/recommendations")
      .send({ rides: fleet.rides, leads: fleet.leads });

    expect(response.status).toBe(200);
    expect(isAnalysisResponse(response.body)).toBe(true);
    expect(response.body.ridesImported).toBe(500);
    expect(response.body.leadsImported).toBe(150);

    const local = analyzeFleet(fleet.rides, fleet.leads);
    expect(response.body.kpis.revenue).toBe(local.kpis.revenue);
    expect(response.body.opportunity).toEqual(local.opportunity);
  });

  it("returns validation errors for non-array request fields", async () => {
    const response = await request(app)
      .post("/api/recommendations")
      .send({ rides: "invalid", leads: 123 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_failed");
  });

  it("returns validation errors for malformed row values", async () => {
    const response = await request(app)
      .post("/api/recommendations")
      .send({ rides: [{ ride_id: 42 }], leads: [] });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_failed");
  });

  it("returns simulation projection for valid request", async () => {
    const fleet = generateDemoFleet(42);
    const analysis = analyzeFleet(fleet.rides, fleet.leads);
    const expected = simulateBestPlan(analysis.kpis, analysis.recommendations);

    const response = await request(app)
      .post("/api/simulations")
      .send({
        actions: analysis.recommendations.slice(0, 2).map((r) => ({ actionId: r.id, intensity: 80 })),
        baselineKpis: analysis.kpis,
        recommendations: analysis.recommendations
      });

    expect(response.status).toBe(200);
    expect(isSimulationResponse(response.body)).toBe(true);
    expect(response.body.projected.revenue).toBeGreaterThan(response.body.current.revenue);
    expect(response.body.threeStepPlan).toHaveLength(3);
  });

  it("returns validation errors for missing simulation fields", async () => {
    const response = await request(app).post("/api/simulations").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_failed");
  });
});
