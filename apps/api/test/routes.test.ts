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

  it("handles non-array request fields as empty imports", async () => {
    const response = await request(app)
      .post("/api/recommendations")
      .send({ rides: "invalid", leads: 123 });

    expect(response.status).toBe(200);
    expect(isRecommendationResponse(response.body)).toBe(true);
    expect(response.body.summary.ridesImported).toBe(0);
    expect(response.body.summary.leadsImported).toBe(0);
  });
});
