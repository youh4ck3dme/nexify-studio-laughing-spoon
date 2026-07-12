import type {
  ProjectionSummary,
  RecommendationAction,
  RecommendationResponse,
  SimulationResponse
} from "@fleet/shared";
import { CsvImportError, parseCsv } from "./csv";

type InputRow = Record<string, string>;
type AnalysisState = "idle" | "loading" | "error" | "empty" | "success";
type FetchRecommendations = typeof fetch;

type DashboardAppOptions = {
  root: HTMLDivElement;
  fetchImpl?: FetchRecommendations;
  apiUrl?: string;
  simulationsApiUrl?: string;
};

type UploadState = {
  fileName: string | null;
  rows: InputRow[];
  status: string;
  error: string;
};

type DashboardState = {
  rides: UploadState;
  leads: UploadState;
  analysisState: AnalysisState;
  analysisResult: RecommendationResponse | null;
  analysisError: string;
  currentProjection: ProjectionSummary | null;
  selectedActionId: string | null;
  selectionState: string;
  applyingSimulation: boolean;
  appliedState: string;
  kpiState: string;
};

function createUploadState(): UploadState {
  return { fileName: null, rows: [], status: "", error: "" };
}

export function mountDashboardApp({
  root,
  fetchImpl = window.fetch.bind(window),
  apiUrl = "http://localhost:4000/api/recommendations",
  simulationsApiUrl = "http://localhost:4000/api/simulations"
}: DashboardAppOptions): void {
  root.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <main id="main-content" class="container">
      <h1>FleetRevenue Copilot</h1>
      <p class="subtitle">Upload rides + leads, run analysis, select an action, and apply a simulation.</p>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <h2>Import flow</h2>
            <p class="panel-copy">Upload rides and leads CSV exports to unlock analysis.</p>
          </div>
          <span class="premium-badge">Premium</span>
        </div>
        <div class="row upload-row">
          <div class="upload-field">
            <label for="rides-file-input">Rides CSV</label>
            <input id="rides-file-input" data-testid="rides-file-input" type="file" accept=".csv" />
            <p id="rides-upload-status" data-testid="rides-upload-status" class="status" role="status" aria-live="polite" aria-atomic="true"></p>
          </div>
          <div class="upload-field">
            <label for="leads-file-input">Leads CSV</label>
            <input id="leads-file-input" data-testid="leads-file-input" type="file" accept=".csv" />
            <p id="leads-upload-status" data-testid="leads-upload-status" class="status" role="status" aria-live="polite" aria-atomic="true"></p>
          </div>
        </div>
        <div class="row">
          <button id="run-analysis" data-testid="run-analysis" type="button">Run analysis</button>
        </div>
        <p id="import-state" data-testid="import-state" class="status" role="status" aria-live="polite" aria-atomic="true"></p>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <h2>KPI projection</h2>
            <p class="panel-copy">Revenue, idle-time, and conversion shifts update after analysis and simulation.</p>
          </div>
        </div>
        <p id="kpi-state" data-testid="kpi-state" class="status" role="status" aria-live="polite" aria-atomic="true"></p>
        <div id="kpi-grid" class="kpi-grid"></div>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <h2>Recommended actions</h2>
            <p class="panel-copy">Select an action, then apply the simulation to project its impact.</p>
          </div>
        </div>
        <p id="selection-state" data-testid="selection-state" class="status" role="status" aria-live="polite" aria-atomic="true"></p>
        <ul id="action-list" class="action-list" aria-live="polite"></ul>
        <div class="row">
          <button id="apply-simulation" data-testid="apply-simulation" type="button">Apply simulation</button>
        </div>
        <p id="applied-state" data-testid="applied-state" class="status" role="status" aria-live="polite" aria-atomic="true"></p>
      </section>
    </main>
  `;

  const ridesFileInput = getRequiredElement<HTMLInputElement>(root, "#rides-file-input");
  const leadsFileInput = getRequiredElement<HTMLInputElement>(root, "#leads-file-input");
  const ridesUploadStatus = getRequiredElement<HTMLParagraphElement>(root, "#rides-upload-status");
  const leadsUploadStatus = getRequiredElement<HTMLParagraphElement>(root, "#leads-upload-status");
  const runAnalysisBtn = getRequiredElement<HTMLButtonElement>(root, "#run-analysis");
  const importState = getRequiredElement<HTMLParagraphElement>(root, "#import-state");
  const kpiState = getRequiredElement<HTMLParagraphElement>(root, "#kpi-state");
  const kpiGrid = getRequiredElement<HTMLDivElement>(root, "#kpi-grid");
  const selectionState = getRequiredElement<HTMLParagraphElement>(root, "#selection-state");
  const actionList = getRequiredElement<HTMLUListElement>(root, "#action-list");
  const applySimulationBtn = getRequiredElement<HTMLButtonElement>(root, "#apply-simulation");
  const appliedState = getRequiredElement<HTMLParagraphElement>(root, "#applied-state");

  const state: DashboardState = {
    rides: createUploadState(),
    leads: createUploadState(),
    analysisState: "idle",
    analysisResult: null,
    analysisError: "",
    currentProjection: null,
    selectedActionId: null,
    selectionState: "",
    applyingSimulation: false,
    appliedState: "",
    kpiState: ""
  };

  ridesFileInput.addEventListener("change", () => {
    void handleFileUpload(ridesFileInput, state.rides, "Rides").then(render);
  });

  leadsFileInput.addEventListener("change", () => {
    void handleFileUpload(leadsFileInput, state.leads, "Leads").then(render);
  });

  runAnalysisBtn.addEventListener("click", async () => {
    if (!isAnalysisReady(state)) {
      return;
    }

    state.analysisState = "loading";
    state.analysisError = "";
    resetSelectionAndApplication();
    importState.textContent = "Analyzing...";
    render();

    try {
      const response = await fetchImpl(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rides: state.rides.rows,
          leads: state.leads.rows
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as RecommendationResponse;
      state.analysisResult = data;
      state.analysisState = data.actions.length === 0 ? "empty" : "success";
      state.currentProjection = {
        estimatedRevenueLiftPct: data.summary.estimatedRevenueLiftPct,
        estimatedIdleTimeDropPct: data.summary.estimatedIdleTimeDropPct,
        estimatedLeadConversionLiftPct: data.summary.estimatedLeadConversionLiftPct
      };
    } catch (error) {
      state.analysisResult = null;
      state.analysisState = "error";
      state.analysisError = error instanceof Error ? error.message : "Unknown error";
      state.currentProjection = null;
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

    if (!button || !actionId) {
      return;
    }

    const action = state.analysisResult?.actions.find((item) => item.id === actionId);
    state.selectedActionId = actionId;
    state.selectionState = action ? `Selected action: ${action.title}` : "";
    state.appliedState = "";
    render();
  });

  applySimulationBtn.addEventListener("click", async () => {
    if (!state.selectedActionId || state.applyingSimulation) {
      return;
    }

    state.applyingSimulation = true;
    render();

    try {
      const response = await fetchImpl(simulationsApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: state.selectedActionId })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as SimulationResponse;
      state.currentProjection = data.projectedSummary;
      state.appliedState = `Simulation applied: ${data.appliedAction.title}`;
      state.kpiState = `Applied simulation for "${data.appliedAction.title}".`;
    } catch (error) {
      state.appliedState = `Simulation failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    }

    state.applyingSimulation = false;
    render();
  });

  render();

  async function handleFileUpload(
    input: HTMLInputElement,
    upload: UploadState,
    label: string
  ): Promise<void> {
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      upload.fileName = file.name;
      upload.rows = parsed.rows;
      upload.error = "";
      upload.status = `${label} CSV loaded: ${file.name} (${parsed.rows.length} rows)`;
    } catch (error) {
      upload.rows = [];
      upload.error = error instanceof CsvImportError ? error.message : "Failed to read CSV file.";
      upload.status = `${label} CSV failed to load: ${upload.error}`;
    }

    resetAnalysis();
  }

  function resetAnalysis(): void {
    state.analysisState = "idle";
    state.analysisResult = null;
    state.analysisError = "";
    state.currentProjection = null;
    resetSelectionAndApplication();
  }

  function resetSelectionAndApplication(): void {
    state.selectedActionId = null;
    state.selectionState = "";
    state.appliedState = "";
    state.kpiState = "";
  }

  function render(): void {
    const ready = isAnalysisReady(state);
    const loading = state.analysisState === "loading";

    ridesUploadStatus.textContent = state.rides.status;
    leadsUploadStatus.textContent = state.leads.status;

    runAnalysisBtn.disabled = !ready || loading;
    runAnalysisBtn.textContent = loading ? "Analyzing..." : "Run analysis";

    if (state.analysisState !== "loading") {
      importState.textContent = getImportStateMessage(state);
    }

    kpiState.textContent = state.kpiState;
    selectionState.textContent = state.selectionState;
    appliedState.textContent = state.appliedState;

    applySimulationBtn.disabled = !state.selectedActionId || state.applyingSimulation;
    applySimulationBtn.textContent = state.applyingSimulation ? "Applying..." : "Apply simulation";

    renderKpis(kpiGrid, state);
    renderActionList(actionList, state.analysisResult?.actions ?? [], state.selectedActionId);
  }
}

function isAnalysisReady(state: DashboardState): boolean {
  return state.rides.rows.length > 0 && state.leads.rows.length > 0;
}

function getImportStateMessage(state: DashboardState): string {
  switch (state.analysisState) {
    case "error":
      return `Analysis failed: ${state.analysisError}`;
    case "empty":
      return "Analysis completed, but no recommendations matched the current import.";
    case "success":
      return "Analysis complete. Select an action to simulate.";
    default:
      return isAnalysisReady(state)
        ? "Rides and leads ready. Run analysis to continue."
        : "Upload rides and leads CSV files to unlock analysis.";
  }
}

function renderKpis(container: HTMLDivElement, state: DashboardState): void {
  const projection = state.currentProjection;
  const summary = state.analysisResult?.summary;

  if (!projection || !summary) {
    container.innerHTML = '<p class="empty-state">Run analysis to populate KPIs.</p>';
    return;
  }

  container.innerHTML = `
    <article class="kpi"><strong>Rides</strong><span data-testid="kpi-rides-value">${summary.ridesImported}</span></article>
    <article class="kpi"><strong>Leads</strong><span data-testid="kpi-leads-value">${summary.leadsImported}</span></article>
    <article class="kpi"><strong>Revenue lift</strong><span data-testid="kpi-revenue-value">+${formatPct(projection.estimatedRevenueLiftPct)}%</span></article>
    <article class="kpi"><strong>Idle time drop</strong><span data-testid="kpi-idle-value">-${formatPct(projection.estimatedIdleTimeDropPct)}%</span></article>
    <article class="kpi"><strong>Conversion lift</strong><span data-testid="kpi-conversion-value">+${formatPct(projection.estimatedLeadConversionLiftPct)}%</span></article>
  `;
}

function formatPct(value: number): string {
  return value.toFixed(1);
}

function renderActionList(
  container: HTMLUListElement,
  actions: RecommendationAction[],
  selectedActionId: string | null
): void {
  if (actions.length === 0) {
    container.innerHTML = '<li class="empty-state">No actions to select yet. Run analysis to generate recommendations.</li>';
    return;
  }

  container.innerHTML = actions
    .map((action) => {
      const selected = action.id === selectedActionId;
      return `
        <li>
          <strong>${escapeHtml(action.title)}</strong>
          <p>${escapeHtml(action.expectedImpact)}</p>
          <button data-testid="select-action-${escapeHtml(action.id)}" data-action-id="${escapeHtml(action.id)}" type="button" aria-pressed="${selected}">
            ${selected ? "Selected" : "Select action"}
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
