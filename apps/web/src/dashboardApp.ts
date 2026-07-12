import type { RecommendationAction, RecommendationResponse } from "@fleet/shared";

type InputRow = Record<string, string>;
type AnalysisState = "idle" | "loading" | "error" | "empty" | "success";
type FetchRecommendations = typeof fetch;

type DashboardAppOptions = {
  root: HTMLDivElement;
  fetchImpl?: FetchRecommendations;
  apiUrl?: string;
  mockRides?: InputRow[];
  mockLeads?: InputRow[];
};

type DashboardState = {
  ridesImported: boolean;
  leadsImported: boolean;
  analysisState: AnalysisState;
  analysisResult: RecommendationResponse | null;
  analysisError: string;
  appliedActionIds: Set<string>;
  actionFeedback: string;
};

const defaultMockRides: InputRow[] = [
  { ride_id: "r1", zone: "A", hour_slot: "17", fare: "14.5" },
  { ride_id: "r2", zone: "B", hour_slot: "18", fare: "11.0" }
];

const defaultMockLeads: InputRow[] = [
  { lead_id: "l1", source: "web", priority: "A" },
  { lead_id: "l2", source: "phone", priority: "B" }
];

export function mountDashboardApp({
  root,
  fetchImpl = window.fetch.bind(window),
  apiUrl = "http://localhost:4000/api/recommendations",
  mockRides = defaultMockRides,
  mockLeads = defaultMockLeads
}: DashboardAppOptions): void {
  root.innerHTML = `
    <main class="container">
      <h1>FleetRevenue Copilot</h1>
      <p class="subtitle">Upload rides + leads, get actions, apply and simulate impact.</p>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <h2>Premium dashboard import flow</h2>
            <p class="panel-copy">Mock CSV imports drive the premium analysis path in this MVP.</p>
          </div>
          <span class="premium-badge">Premium</span>
        </div>
        <div class="row">
          <button id="import-rides" type="button">Import rides CSV</button>
          <button id="import-leads" type="button">Import leads CSV</button>
          <button id="run-analysis" type="button">Run analysis</button>
        </div>
        <p id="import-state" class="status" aria-live="polite"></p>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <h2>KPI projection</h2>
            <p class="panel-copy">Revenue, idle-time, and conversion shifts update after each analysis.</p>
          </div>
        </div>
        <p id="analysis-status" class="status" aria-live="polite"></p>
        <div id="kpi-grid" class="kpi-grid"></div>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <h2>Recommended actions</h2>
            <p class="panel-copy">Apply premium actions one by one to track operator feedback.</p>
          </div>
        </div>
        <p id="action-feedback" class="feedback" aria-live="polite"></p>
        <ul id="action-list" class="action-list"></ul>
      </section>
    </main>
  `;

  const importRidesBtn = getRequiredElement<HTMLButtonElement>(root, "#import-rides");
  const importLeadsBtn = getRequiredElement<HTMLButtonElement>(root, "#import-leads");
  const runAnalysisBtn = getRequiredElement<HTMLButtonElement>(root, "#run-analysis");
  const importState = getRequiredElement<HTMLParagraphElement>(root, "#import-state");
  const analysisStatus = getRequiredElement<HTMLParagraphElement>(root, "#analysis-status");
  const kpiGrid = getRequiredElement<HTMLDivElement>(root, "#kpi-grid");
  const actionFeedback = getRequiredElement<HTMLParagraphElement>(root, "#action-feedback");
  const actionList = getRequiredElement<HTMLUListElement>(root, "#action-list");

  const state: DashboardState = {
    ridesImported: false,
    leadsImported: false,
    analysisState: "idle",
    analysisResult: null,
    analysisError: "",
    appliedActionIds: new Set<string>(),
    actionFeedback: ""
  };

  importRidesBtn.addEventListener("click", () => {
    state.ridesImported = true;
    resetAnalysis();
    render();
  });

  importLeadsBtn.addEventListener("click", () => {
    state.leadsImported = true;
    resetAnalysis();
    render();
  });

  runAnalysisBtn.addEventListener("click", async () => {
    if (!isAnalysisReady(state)) {
      return;
    }

    state.analysisState = "loading";
    state.analysisError = "";
    state.actionFeedback = "";
    render();

    try {
      const response = await fetchImpl(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rides: mockRides,
          leads: mockLeads
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as RecommendationResponse;
      state.analysisResult = data;
      state.analysisState = data.actions.length === 0 ? "empty" : "success";
      state.appliedActionIds.clear();
    } catch (error) {
      state.analysisResult = null;
      state.analysisState = "error";
      state.analysisError = error instanceof Error ? error.message : "Unknown error";
    }

    render();
  });

  actionList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest<HTMLButtonElement>("button[data-action-id]");
    const actionId = button?.dataset.actionId;

    if (!button || !actionId || state.appliedActionIds.has(actionId)) {
      return;
    }

    const action = state.analysisResult?.actions.find((item) => item.id === actionId);
    state.appliedActionIds.add(actionId);
    state.actionFeedback = action
      ? `Applied ${action.title} to the premium plan.`
      : "Applied premium recommendation.";
    renderActionList(
      actionList,
      state.analysisResult?.actions ?? [],
      state.appliedActionIds,
      state.analysisResult !== null
    );
    actionFeedback.textContent = state.actionFeedback;
  });

  render();

  function resetAnalysis(): void {
    state.analysisState = "idle";
    state.analysisResult = null;
    state.analysisError = "";
    state.actionFeedback = "";
    state.appliedActionIds.clear();
  }

  function render(): void {
    const ready = isAnalysisReady(state);
    const loading = state.analysisState === "loading";

    runAnalysisBtn.disabled = !ready || loading;
    runAnalysisBtn.textContent = loading ? "Analyzing..." : "Run analysis";
    importState.textContent = getImportStateMessage(state, mockRides.length, mockLeads.length);
    analysisStatus.textContent = getAnalysisStatusMessage(state, mockRides.length, mockLeads.length);
    actionFeedback.textContent = state.actionFeedback;

    renderKpis(kpiGrid, state.analysisResult);
    renderActionList(
      actionList,
      state.analysisResult?.actions ?? [],
      state.appliedActionIds,
      state.analysisResult !== null
    );
  }
}

function isAnalysisReady(state: DashboardState): boolean {
  return state.ridesImported && state.leadsImported;
}

function getImportStateMessage(
  state: DashboardState,
  ridesCount: number,
  leadsCount: number
): string {
  if (state.ridesImported && state.leadsImported) {
    return "Rides and leads ready. Run analysis to refresh the premium dashboard.";
  }

  if (state.ridesImported) {
    return `Rides ready (${ridesCount}). Import leads to unlock analysis.`;
  }

  if (state.leadsImported) {
    return `Leads ready (${leadsCount}). Import rides to unlock analysis.`;
  }

  return "Import rides and leads to unlock analysis.";
}

function getAnalysisStatusMessage(
  state: DashboardState,
  ridesCount: number,
  leadsCount: number
): string {
  switch (state.analysisState) {
    case "loading":
      return "Refreshing premium dashboard...";
    case "error":
      return `Premium analysis failed: ${state.analysisError}`;
    case "empty":
      return "Analysis completed, but no recommendations matched the current import.";
    case "success":
      return `Premium dashboard updated from ${ridesCount} rides and ${leadsCount} leads.`;
    default:
      return isAnalysisReady(state)
        ? "Premium analysis is ready when you are."
        : "Import both datasets to unlock premium analysis.";
  }
}

function renderKpis(container: HTMLDivElement, data: RecommendationResponse | null): void {
  if (!data) {
    container.innerHTML = '<p class="empty-state">Run analysis to populate premium KPIs.</p>';
    return;
  }

  container.innerHTML = `
    <article class="kpi"><strong>Rides</strong><span>${data.summary.ridesImported}</span></article>
    <article class="kpi"><strong>Leads</strong><span>${data.summary.leadsImported}</span></article>
    <article class="kpi"><strong>Revenue lift</strong><span>+${data.summary.estimatedRevenueLiftPct}%</span></article>
    <article class="kpi"><strong>Idle time drop</strong><span>-${data.summary.estimatedIdleTimeDropPct}%</span></article>
    <article class="kpi"><strong>Conversion lift</strong><span>+${data.summary.estimatedLeadConversionLiftPct}%</span></article>
  `;
}

function renderActionList(
  container: HTMLUListElement,
  actions: RecommendationAction[],
  appliedActionIds: Set<string>,
  hasAnalysis: boolean
): void {
  if (actions.length === 0) {
    container.innerHTML =
      hasAnalysis
        ? '<li class="empty-state">No actions recommended for the current import.</li>'
        : '<li class="empty-state">No actions to apply yet. Run analysis to generate recommendations.</li>';
    return;
  }

  container.innerHTML = actions
    .map((action) => {
      const applied = appliedActionIds.has(action.id);
      return `
        <li>
          <strong>${escapeHtml(action.title)}</strong>
          <p>${escapeHtml(action.expectedImpact)}</p>
          <button data-action-id="${escapeHtml(action.id)}" type="button" ${applied ? "disabled" : ""}>
            ${applied ? "Applied" : "Apply recommendation"}
          </button>
        </li>
      `;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getRequiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}
