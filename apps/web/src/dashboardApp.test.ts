import { describe, expect, it, beforeEach } from "vitest";
import { generateDemoFleet, analyzeFleet } from "@fleet/shared";
import { mountApp } from "./app/mountApp";

describe("mountApp", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it("renders landing screen with launch demo CTA", () => {
    const root = document.querySelector<HTMLDivElement>("#app")!;
    mountApp({ root });
    expect(root.querySelector('[data-testid="load-demo"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="screen-landing"]')).not.toBeNull();
    expect(root.textContent).toContain("FleetRevenue AI");
  });

  it("loads demo fleet and reaches command center", async () => {
    const root = document.querySelector<HTMLDivElement>("#app")!;
    mountApp({ root });

    root.querySelector<HTMLButtonElement>('[data-testid="load-demo"]')!.click();

    await waitFor(() => root.querySelector('[data-testid="screen-command-center"]') !== null, 5000);

    expect(root.querySelector('[data-testid="kpi-revenue"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="chart-revenue"]')).not.toBeNull();
  });

  it("demo fleet produces expected row counts in analysis", () => {
    const fleet = generateDemoFleet(42);
    const analysis = analyzeFleet(fleet.rides, fleet.leads);
    expect(analysis.ridesImported).toBe(500);
    expect(analysis.leadsImported).toBe(150);
    expect(analysis.recommendations.some((r) => r.isBestNextAction)).toBe(true);
  });
});

async function waitFor(condition: () => boolean, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) throw new Error("Timeout waiting for condition");
    await new Promise((r) => setTimeout(r, 50));
  }
}
