import type { RecommendationResponse } from "@fleet/shared";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <main class="container">
    <h1>FleetRevenue Copilot</h1>
    <p class="subtitle">Upload rides + leads, get actions, apply and simulate impact.</p>

    <section class="panel">
      <h2>Data import (skeleton)</h2>
      <div class="row">
        <button id="import-rides">Import rides CSV</button>
        <button id="import-leads">Import leads CSV</button>
        <button id="run-analysis">Run analysis</button>
      </div>
      <p id="import-state">Using mock data for now.</p>
    </section>

    <section class="panel">
      <h2>KPI projection</h2>
      <div id="kpi-grid" class="kpi-grid"></div>
    </section>

    <section class="panel">
      <h2>Recommended actions</h2>
      <ul id="action-list" class="action-list"></ul>
    </section>
  </main>
`;

const importState = document.querySelector<HTMLParagraphElement>("#import-state");
const runAnalysisBtn = document.querySelector<HTMLButtonElement>("#run-analysis");
const kpiGrid = document.querySelector<HTMLDivElement>("#kpi-grid")!;
const actionList = document.querySelector<HTMLUListElement>("#action-list")!;

if (!importState || !runAnalysisBtn || !kpiGrid || !actionList) {
  throw new Error("UI initialization failed");
}

const mockRides = [
  { ride_id: "r1", zone: "A", hour_slot: "17", fare: "14.5" },
  { ride_id: "r2", zone: "B", hour_slot: "18", fare: "11.0" }
];

const mockLeads = [
  { lead_id: "l1", source: "web", priority: "A" },
  { lead_id: "l2", source: "phone", priority: "B" }
];

document.querySelector<HTMLButtonElement>("#import-rides")?.addEventListener("click", () => {
  importState.textContent = `Rides loaded: ${mockRides.length}`;
});

document.querySelector<HTMLButtonElement>("#import-leads")?.addEventListener("click", () => {
  importState.textContent = `Leads loaded: ${mockLeads.length}`;
});

runAnalysisBtn.addEventListener("click", async () => {
  runAnalysisBtn.disabled = true;
  runAnalysisBtn.textContent = "Analyzing...";

  try {
    const response = await fetch("http://localhost:4000/api/recommendations", {
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
    renderKpis(data);
    renderActions(data);
  } catch (error) {
    importState.textContent = error instanceof Error ? error.message : "Unknown error";
  } finally {
    runAnalysisBtn.disabled = false;
    runAnalysisBtn.textContent = "Run analysis";
  }
});

function renderKpis(data: RecommendationResponse): void {
  kpiGrid.innerHTML = `
    <article class="kpi"><strong>Rides</strong><span>${data.summary.ridesImported}</span></article>
    <article class="kpi"><strong>Leads</strong><span>${data.summary.leadsImported}</span></article>
    <article class="kpi"><strong>Revenue lift</strong><span>+${data.summary.estimatedRevenueLiftPct}%</span></article>
    <article class="kpi"><strong>Idle time drop</strong><span>-${data.summary.estimatedIdleTimeDropPct}%</span></article>
    <article class="kpi"><strong>Conversion lift</strong><span>+${data.summary.estimatedLeadConversionLiftPct}%</span></article>
  `;
}

function renderActions(data: RecommendationResponse): void {
  actionList.innerHTML = data.actions
    .map(
      (action: RecommendationResponse["actions"][number]) => `
        <li>
          <strong>${action.title}</strong>
          <p>${action.expectedImpact}</p>
          <button data-action-id="${action.id}">Apply recommendation</button>
        </li>
      `
    )
    .join("");
}
