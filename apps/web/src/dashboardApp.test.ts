import type { RecommendationResponse } from "@fleet/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountDashboardApp } from "./dashboardApp";

type FetchMock = ReturnType<typeof vi.fn> & typeof fetch;

const successResponse: RecommendationResponse = {
  summary: {
    ridesImported: 2,
    leadsImported: 2,
    estimatedRevenueLiftPct: 11.8,
    estimatedIdleTimeDropPct: 9.4,
    estimatedLeadConversionLiftPct: 13.1
  },
  actions: [
    {
      id: "dispatch-peak-zones",
      title: "Reallocate 3 vehicles to Zone A between 17:00-19:00",
      expectedImpact: "+7% completed rides in peak window"
    },
    {
      id: "pricing-evening-boost",
      title: "Apply +12% dynamic price multiplier in downtown peak",
      expectedImpact: "+9% revenue in evening slots"
    }
  ]
};

describe("mountDashboardApp", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it("gates analysis until both imports finish and reflects import state transitions", () => {
    const fetchImpl = vi.fn() as unknown as FetchMock;
    setup(fetchImpl);
    const runAnalysisButton = getButton("#run-analysis");

    expect(runAnalysisButton.disabled).toBe(true);
    expect(text("#import-state")).toBe("Import rides and leads to unlock analysis.");

    runAnalysisButton.click();
    expect(fetchImpl).not.toHaveBeenCalled();

    getButton("#import-rides").click();
    expect(text("#import-state")).toBe("Rides ready (2). Import leads to unlock analysis.");
    expect(runAnalysisButton.disabled).toBe(true);

    getButton("#import-leads").click();
    expect(text("#import-state")).toBe(
      "Rides and leads ready. Run analysis to refresh the premium dashboard."
    );
    expect(text("#analysis-status")).toBe("Premium analysis is ready when you are.");
    expect(runAnalysisButton.disabled).toBe(false);
  });

  it("shows loading and success states for the premium dashboard analysis flow", async () => {
    const pendingResponse = deferred<Response>();
    const fetchImpl = vi.fn(() => pendingResponse.promise) as unknown as FetchMock;
    setup(fetchImpl);

    getButton("#import-rides").click();
    getButton("#import-leads").click();
    const runAnalysisButton = getButton("#run-analysis");

    runAnalysisButton.click();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(runAnalysisButton.disabled).toBe(true);
    expect(runAnalysisButton.textContent?.trim()).toBe("Analyzing...");
    expect(text("#analysis-status")).toBe("Refreshing premium dashboard...");

    pendingResponse.resolve(createResponse(successResponse));
    await flushPromises();

    expect(runAnalysisButton.disabled).toBe(false);
    expect(runAnalysisButton.textContent?.trim()).toBe("Run analysis");
    expect(text("#analysis-status")).toBe("Premium dashboard updated from 2 rides and 2 leads.");
    expect(text("#kpi-grid")).toContain("11.8%");
    expect(document.querySelectorAll("#action-list button").length).toBe(2);
  });

  it("shows an error state when premium analysis fails", async () => {
    const fetchImpl = vi.fn(async () => createResponse({}, 503)) as unknown as FetchMock;
    setup(fetchImpl);

    getButton("#import-rides").click();
    getButton("#import-leads").click();
    getButton("#run-analysis").click();
    await flushPromises();

    expect(text("#analysis-status")).toBe("Premium analysis failed: API error: 503");
    expect(text("#kpi-grid")).toBe("Run analysis to populate premium KPIs.");
    expect(text("#action-list")).toBe(
      "No actions to apply yet. Run analysis to generate recommendations."
    );
  });

  it("shows an empty state when analysis returns no recommended actions", async () => {
    const emptyResponse: RecommendationResponse = {
      summary: {
        ridesImported: 5,
        leadsImported: 4,
        estimatedRevenueLiftPct: 3.2,
        estimatedIdleTimeDropPct: 1.5,
        estimatedLeadConversionLiftPct: 2.1
      },
      actions: []
    };
    const fetchImpl = vi.fn(async () => createResponse(emptyResponse)) as unknown as FetchMock;
    setup(fetchImpl);

    getButton("#import-rides").click();
    getButton("#import-leads").click();
    getButton("#run-analysis").click();
    await flushPromises();

    expect(text("#analysis-status")).toBe(
      "Analysis completed, but no recommendations matched the current import."
    );
    expect(text("#kpi-grid")).toContain("3.2%");
    expect(text("#action-list")).toBe("No actions recommended for the current import.");
  });

  it("shows applied-action feedback after a recommendation is accepted", async () => {
    const fetchImpl = vi.fn(async () => createResponse(successResponse)) as unknown as FetchMock;
    setup(fetchImpl);

    getButton("#import-rides").click();
    getButton("#import-leads").click();
    getButton("#run-analysis").click();
    await flushPromises();

    getButton('button[data-action-id="dispatch-peak-zones"]').click();
    const applyButton = getButton('button[data-action-id="dispatch-peak-zones"]');

    expect(text("#action-feedback")).toBe(
      "Applied Reallocate 3 vehicles to Zone A between 17:00-19:00 to the premium plan."
    );
    expect(applyButton.disabled).toBe(true);
    expect(applyButton.textContent?.replace(/\s+/g, " ").trim()).toBe("Applied");
  });
});

function setup(fetchImpl: typeof fetch): void {
  const root = document.querySelector<HTMLDivElement>("#app");

  if (!root) {
    throw new Error("Missing app root");
  }

  mountDashboardApp({ root, fetchImpl });
}

function getButton(selector: string): HTMLButtonElement {
  const button = document.querySelector<HTMLButtonElement>(selector);

  if (!button) {
    throw new Error(`Missing button for selector: ${selector}`);
  }

  return button;
}

function text(selector: string): string {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Missing element for selector: ${selector}`);
  }

  return element.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function createResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
