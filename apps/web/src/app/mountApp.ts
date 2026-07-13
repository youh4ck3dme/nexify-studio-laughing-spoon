import {
  generateDemoFleet,
  simulateBestPlan,
  simulatePlan,
  type AnalysisResponse,
  type SimulationResponse
} from "@fleet/shared";
import { runAnalysisAsync } from "./analyzeRunner.js";
import {
  ANALYSIS_STEPS,
  createInitialState,
  type AppState,
  type Screen,
  type SimulationSelection
} from "./state.js";
import { renderAppHeader } from "../components/AppHeader.js";
import { renderLanding } from "../screens/LandingScreen.js";
import { renderAnalysisAnimation } from "../screens/AnalysisAnimation.js";
import { renderCommandCenter } from "../screens/CommandCenter.js";
import { renderOpportunityMap } from "../screens/OpportunityMap.js";
import { renderRecommendations } from "../screens/RecommendationsScreen.js";
import { renderSimulationStudio } from "../screens/SimulationStudio.js";
import { renderExecutiveBrief } from "../screens/ExecutiveBrief.js";
import { renderWowOverlay } from "../screens/WowOverlay.js";
import { loadJudgeModeFromSession, renderJudgeModePanel, saveJudgeModeToSession } from "../screens/JudgeModePanel.js";
import { CsvImportError, parseCsv } from "../csv.js";

type MountAppOptions = {
  root: HTMLDivElement;
  fetchImpl?: typeof fetch;
  apiUrl?: string;
  simulationsApiUrl?: string;
};

const DEFAULT_API_BASE = import.meta.env.PROD ? "" : "http://localhost:4000";

function resolveApiBaseUrl(): string {
  const envVal: string | undefined = import.meta.env.VITE_API_URL;
  if (envVal !== undefined) return envVal.replace(/\/$/, "");
  return DEFAULT_API_BASE;
}

function initSimulationSelections(analysis: AnalysisResponse): SimulationSelection[] {
  return analysis.recommendations.map((rec) => ({
    actionId: rec.id,
    intensity: rec.isBestNextAction ? 100 : 70,
    enabled: true
  }));
}

function computeSimulation(state: AppState): SimulationResponse | null {
  if (!state.analysis) return null;
  const actions = state.simulationSelections
    .filter((s) => s.enabled)
    .map((s) => ({ actionId: s.actionId, intensity: s.intensity }));
  if (actions.length === 0) {
    return simulatePlan(
      { baselineKpis: state.analysis.kpis, actions: [] },
      state.analysis.recommendations,
      state.analysis.opportunity
    );
  }
  return simulatePlan(
    { baselineKpis: state.analysis.kpis, actions },
    state.analysis.recommendations,
    state.analysis.opportunity
  );
}

export function mountApp({ root, fetchImpl = window.fetch.bind(window), ...urlOptions }: MountAppOptions): void {
  const base = resolveApiBaseUrl();
  const apiUrl = urlOptions.apiUrl ?? `${base}/api/recommendations`;
  const simulationsApiUrl = urlOptions.simulationsApiUrl ?? `${base}/api/simulations`;

  let state = createInitialState();
  state.judgeModeOpen = loadJudgeModeFromSession();
  let pendingRides: ReturnType<typeof parseCsv> | null = null;
  let pendingLeads: ReturnType<typeof parseCsv> | null = null;

  root.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <div id="main-content" class="app-shell"></div>
  `;

  const shell = root.querySelector<HTMLDivElement>("#main-content")!;

  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "load-demo") void loadDemo();
    if (action === "show-upload") toggleUploadPanel();
    if (action === "analyze-csv") void analyzeCsv();
    if (action === "next" || action === "back") navigate(target.dataset.target as Screen);
    if (action === "apply-best-plan") applyBestPlan();
    if (action === "copy-brief") void copyBrief();
    if (action === "toggle-compare") toggleCompare();
    if (action === "reset-baseline") resetBaseline();
    if (action === "dismiss-wow") dismissWow();
    if (action === "reset-demo") resetDemo();
  });

  root.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement;
    if (target.dataset.action === "toggle-judge") {
      toggleJudgeMode(target.checked);
      return;
    }
    if (target.dataset.input === "rides" || target.dataset.input === "leads") {
      void handleFileInput(target);
    }
    if (target.dataset.simToggle) {
      toggleSimAction(target.dataset.simToggle, target.checked);
    }
  });

  root.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement;
    if (target.dataset.simIntensity) {
      updateSimIntensity(target.dataset.simIntensity, Number(target.value));
    }
  });

  render();

  async function loadDemo(): Promise<void> {
    state.error = "";
    const fleet = generateDemoFleet(42);
    state.rides = fleet.rides;
    state.leads = fleet.leads;
    state.dataSource = "demo";
    await runAnalysisFlow();
  }

  function resetDemo(): void {
    state = createInitialState();
    state.judgeModeOpen = loadJudgeModeFromSession();
    pendingRides = null;
    pendingLeads = null;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleJudgeMode(open: boolean): void {
    state.judgeModeOpen = open;
    saveJudgeModeToSession(open);
    render();
  }

  function toggleUploadPanel(): void {
    state.uploadPanelOpen = !state.uploadPanelOpen;
    render();
    if (state.uploadPanelOpen) {
      root.querySelector("#upload-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  async function handleFileInput(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed = parseCsv(await file.text());
      if (input.dataset.input === "rides") pendingRides = parsed;
      else pendingLeads = parsed;
      state.error = "";
      updateAnalyzeCsvButton();
      render();
    } catch (error) {
      if (input.dataset.input === "rides") pendingRides = null;
      else pendingLeads = null;
      state.error = error instanceof CsvImportError ? error.message : "Failed to read CSV.";
      state.uploadPanelOpen = true;
      updateAnalyzeCsvButton();
      render();
    }
  }

  function updateAnalyzeCsvButton(): void {
    const btn = root.querySelector<HTMLButtonElement>("[data-action='analyze-csv']");
    if (btn) btn.disabled = !(pendingRides && pendingLeads);
  }

  async function analyzeCsv(): Promise<void> {
    if (!pendingRides || !pendingLeads) return;
    state.rides = pendingRides.rows;
    state.leads = pendingLeads.rows;
    state.dataSource = "csv";
    await runAnalysisFlow();
  }

  async function runAnalysisFlow(): Promise<void> {
    state.screen = "analyzing";
    state.analysisStep = 0;
    render();

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stepDelay = reducedMotion ? 0 : 600;

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      state.analysisStep = i;
      render();
      if (stepDelay > 0) await sleep(stepDelay);
    }

    const result = await runAnalysisAsync(state.rides, state.leads);
    if (!result.ok) {
      state.error = result.error;
      state.screen = "landing";
      render();
      return;
    }

    state.analysis = result.analysis;
    state.simulationSelections = initSimulationSelections(result.analysis);
    state.simulation = computeSimulation(state);
    state.analysisStep = ANALYSIS_STEPS.length;
    state.screen = "commandCenter";
    render();
  }

  function navigate(screen: Screen): void {
    state.screen = screen;
    if (screen === "simulationStudio") {
      state.simulation = computeSimulation(state);
    }
    render();
  }

  function toggleSimAction(actionId: string, enabled: boolean): void {
    const sel = state.simulationSelections.find((s) => s.actionId === actionId);
    if (sel) sel.enabled = enabled;
    state.simulation = computeSimulation(state);
    render();
  }

  function updateSimIntensity(actionId: string, intensity: number): void {
    const sel = state.simulationSelections.find((s) => s.actionId === actionId);
    if (sel) sel.intensity = intensity;
    state.simulation = computeSimulation(state);
    render();
  }

  function applyBestPlan(): void {
    if (!state.analysis) return;
    state.simulation = simulateBestPlan(
      state.analysis.kpis,
      state.analysis.recommendations,
      state.analysis.opportunity
    );
    state.wowApplied = true;
    state.compareMode = false;
    state.screen = "wowApplied";
    render();
  }

  function toggleCompare(): void {
    state.compareMode = !state.compareMode;
    render();
  }

  function resetBaseline(): void {
    state.wowApplied = false;
    state.compareMode = false;
    state.simulation = computeSimulation(state);
    state.screen = "simulationStudio";
    render();
  }

  function dismissWow(): void {
    state.wowApplied = false;
    state.screen = "executiveBrief";
    render();
  }

  async function copyBrief(): Promise<void> {
    const text = state.analysis?.executiveBrief ?? "";
    const status = root.querySelector("#copy-status");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      if (status) status.textContent = "Brief copied to clipboard.";
    } catch {
      try {
        fallbackCopy(text);
        if (status) status.textContent = "Brief copied to clipboard.";
      } catch {
        if (status) status.textContent = "Copy failed — select text manually.";
      }
    }
  }

  function fallbackCopy(text: string): void {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  function renderScreen(): string {
    const header = renderAppHeader(state);
    const judge = renderJudgeModePanel(state);
    let body: string;
    switch (state.screen) {
      case "landing":
        body = renderLanding(state);
        break;
      case "analyzing":
        body = renderAnalysisAnimation(state);
        break;
      case "commandCenter":
        body = renderCommandCenter(state);
        break;
      case "opportunityMap":
        body = renderOpportunityMap(state);
        break;
      case "recommendations":
        body = renderRecommendations(state);
        break;
      case "simulationStudio":
        body = renderSimulationStudio(state);
        break;
      case "executiveBrief":
        body = renderExecutiveBrief(state);
        break;
      case "wowApplied":
        body = renderSimulationStudio(state) + renderWowOverlay(state);
        break;
      default:
        body = renderLanding(state);
    }
    return `${header}${judge}${body}`;
  }

  function render(): void {
    shell.innerHTML = renderScreen();
    updateAnalyzeCsvButton();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @deprecated Use mountApp */
export function mountDashboardApp(options: MountAppOptions): void {
  mountApp(options);
}
