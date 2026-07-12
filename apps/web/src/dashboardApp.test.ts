import type { RecommendationResponse, SimulationResponse } from "@fleet/shared";
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

const simulationResponse: SimulationResponse = {
  actionId: "dispatch-peak-zones",
  appliedAction: successResponse.actions[0],
  projectedSummary: {
    estimatedRevenueLiftPct: 12.6,
    estimatedIdleTimeDropPct: 12.1,
    estimatedLeadConversionLiftPct: 13.1
  }
};

describe("mountDashboardApp", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it("gates analysis until both CSVs are uploaded and reflects import state transitions", async () => {
    const fetchImpl = vi.fn() as unknown as FetchMock;
    setup(fetchImpl);
    const runAnalysisButton = getButton("#run-analysis");

    expect(runAnalysisButton.disabled).toBe(true);
    expect(text("#import-state")).toBe("Upload rides and leads CSV files to unlock analysis.");

    runAnalysisButton.click();
    expect(fetchImpl).not.toHaveBeenCalled();

    await uploadCsv("#rides-file-input", "rides.csv", "ride_id,zone\nr1,A\nr2,B");
    expect(text("#rides-upload-status")).toBe("Rides CSV loaded: rides.csv (2 rows)");
    expect(runAnalysisButton.disabled).toBe(true);

    await uploadCsv("#leads-file-input", "leads.csv", "lead_id,source\nl1,web");
    expect(text("#leads-upload-status")).toBe("Leads CSV loaded: leads.csv (1 rows)");
    expect(runAnalysisButton.disabled).toBe(false);
    expect(text("#import-state")).toBe("Rides and leads ready. Run analysis to continue.");
  });

  it("shows loading and success states for the analysis flow", async () => {
    const pendingResponse = deferred<Response>();
    const fetchImpl = vi.fn(() => pendingResponse.promise) as unknown as FetchMock;
    setup(fetchImpl);

    await uploadCsv("#rides-file-input", "rides.csv", "ride_id,zone\nr1,A\nr2,B");
    await uploadCsv("#leads-file-input", "leads.csv", "lead_id,source\nl1,web\nl2,phone");
    const runAnalysisButton = getButton("#run-analysis");

    runAnalysisButton.click();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(runAnalysisButton.disabled).toBe(true);
    expect(runAnalysisButton.textContent?.trim()).toBe("Analyzing...");
    expect(text("#import-state")).toBe("Analyzing...");

    pendingResponse.resolve(createResponse(successResponse));
    await flushPromises();

    expect(runAnalysisButton.disabled).toBe(false);
    expect(runAnalysisButton.textContent?.trim()).toBe("Run analysis");
    expect(text("#import-state")).toBe("Analysis complete. Select an action to simulate.");
    expect(text("#kpi-grid")).toContain("11.8%");
    expect(document.querySelectorAll("#action-list button").length).toBe(2);
  });

  it("shows an error state when analysis fails", async () => {
    const fetchImpl = vi.fn(async () => createResponse({}, 503)) as unknown as FetchMock;
    setup(fetchImpl);

    await uploadCsv("#rides-file-input", "rides.csv", "ride_id,zone\nr1,A\nr2,B");
    await uploadCsv("#leads-file-input", "leads.csv", "lead_id,source\nl1,web\nl2,phone");
    getButton("#run-analysis").click();
    await flushPromises();

    expect(text("#import-state")).toBe("Analysis failed: API error: 503");
    expect(text("#kpi-grid")).toBe("Run analysis to populate KPIs.");
    expect(text("#action-list")).toBe(
      "No actions to select yet. Run analysis to generate recommendations."
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

    await uploadCsv("#rides-file-input", "rides.csv", "ride_id,zone\nr1,A\nr2,B");
    await uploadCsv("#leads-file-input", "leads.csv", "lead_id,source\nl1,web\nl2,phone");
    getButton("#run-analysis").click();
    await flushPromises();

    expect(text("#import-state")).toBe(
      "Analysis completed, but no recommendations matched the current import."
    );
    expect(text("#kpi-grid")).toContain("3.2%");
    expect(text("#action-list")).toBe("No actions to select yet. Run analysis to generate recommendations.");
  });

  it("selects an action and applies a simulation, updating KPIs and feedback", async () => {
    const fetchImpl = vi.fn(async (url: RequestInfo | URL) => {
      const href = typeof url === "string" ? url : url.toString();
      if (href.includes("/api/simulations")) {
        return createResponse(simulationResponse);
      }
      return createResponse(successResponse);
    }) as unknown as FetchMock;
    setup(fetchImpl);

    await uploadCsv("#rides-file-input", "rides.csv", "ride_id,zone\nr1,A\nr2,B");
    await uploadCsv("#leads-file-input", "leads.csv", "lead_id,source\nl1,web\nl2,phone");
    getButton("#run-analysis").click();
    await flushPromises();

    getButton('button[data-action-id="dispatch-peak-zones"]').click();
    expect(text("#selection-state")).toBe(
      "Selected action: Reallocate 3 vehicles to Zone A between 17:00-19:00"
    );

    getButton("#apply-simulation").click();
    await flushPromises();

    expect(text("#applied-state")).toBe(
      "Simulation applied: Reallocate 3 vehicles to Zone A between 17:00-19:00"
    );
    expect(text("#kpi-state")).toBe(
      'Applied simulation for "Reallocate 3 vehicles to Zone A between 17:00-19:00".'
    );
    expect(text("#kpi-grid")).toContain("12.6%");
    expect(text("#kpi-grid")).toContain("12.1%");
  });
});

function setup(fetchImpl: typeof fetch): void {
  const root = document.querySelector<HTMLDivElement>("#app");

  if (!root) {
    throw new Error("Missing app root");
  }

  mountDashboardApp({ root, fetchImpl });
}

async function uploadCsv(selector: string, fileName: string, content: string): Promise<void> {
  const input = document.querySelector<HTMLInputElement>(selector);

  if (!input) {
    throw new Error(`Missing file input for selector: ${selector}`);
  }

  const file = new File([content], fileName, { type: "text/csv" });
  Object.defineProperty(input, "files", {
    value: [file],
    configurable: true
  });

  input.dispatchEvent(new Event("change"));
  await flushPromises();
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
  await Promise.resolve();
}
