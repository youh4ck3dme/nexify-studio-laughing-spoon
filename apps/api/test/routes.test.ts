import request from "supertest";
import { describe, expect, it } from "vitest";
import { isRecommendationResponse } from "@fleet/shared";
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

  it("returns recommendation response shape for populated request payloads", async () => {
    const response = await request(app)
      .post("/api/recommendations")
      .send({
        rides: [{ ride_id: "r1", zone: "A" }, { ride_id: "r2", zone: "B" }],
        leads: [{ lead_id: "l1", source: "web" }]
      });

    expect(response.status).toBe(200);
    expect(isRecommendationResponse(response.body)).toBe(true);
    expect(response.body.summary.ridesImported).toBe(2);
    expect(response.body.summary.leadsImported).toBe(1);
  });

  it("handles missing request lists by defaulting imported counts to zero", async () => {
    const response = await request(app).post("/api/recommendations").send({});

    expect(response.status).toBe(200);
    expect(isRecommendationResponse(response.body)).toBe(true);
    expect(response.body.summary.ridesImported).toBe(0);
    expect(response.body.summary.leadsImported).toBe(0);
  });

  it("returns validation errors for non-array request fields", async () => {
    const response = await request(app)
      .post("/api/recommendations")
      .send({ rides: "invalid", leads: 123 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "rides" }),
        expect.objectContaining({ path: "leads" })
      ])
    );
  });

  it("returns validation errors for malformed row values", async () => {
    const response = await request(app)
      .post("/api/recommendations")
      .send({ rides: [{ ride_id: 42 }], leads: [] });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_failed");
    expect(
      response.body.details.some(
        (detail: { path: string; message: string }) =>
          detail.path === "rides[0].ride_id" && detail.message === "Each field value must be a string."
      )
    ).toBe(true);
  });

  it("returns a simulation projection for a known action", async () => {
    const response = await request(app)
      .post("/api/simulations")
      .send({ actionId: "pricing-evening-boost" });

    expect(response.status).toBe(200);
    expect(response.body.actionId).toBe("pricing-evening-boost");
    expect(response.body.appliedAction.id).toBe("pricing-evening-boost");
    expect(typeof response.body.projectedSummary.estimatedRevenueLiftPct).toBe("number");
  });

  it("returns validation errors for an unknown simulation action", async () => {
    const response = await request(app)
      .post("/api/simulations")
      .send({ actionId: "unknown-action" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_failed");
    expect(response.body.details[0].path).toBe("actionId");
  });
});
