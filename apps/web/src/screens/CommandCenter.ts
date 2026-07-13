import type { AppState } from "../app/state.js";
import { renderKpiGrid } from "../components/KpiCard.js";
import { renderPeriodBadge } from "../components/AppHeader.js";
import { renderCharts } from "../charts/svgCharts.js";
import { formatEur } from "../utils/format.js";

export function renderCommandCenter(state: AppState): string {
  const analysis = state.analysis;
  if (!analysis) return "";

  const kpis = state.compareMode && state.simulation ? state.simulation.projected : analysis.kpis;
  const label = state.compareMode ? "Projected" : "Current";

  return `
    <section class="screen screen--command" data-testid="screen-command-center">
      <header class="screen-header">
        <div>
          <p class="screen-header__eyebrow">Command Center</p>
          <h2>Fleet performance overview</h2>
          ${renderPeriodBadge(state)}
          <p class="panel-copy">${analysis.ridesImported} rides · ${analysis.leadsImported} leads · estimated monthly opportunity (base case) ${formatEur(analysis.opportunity.baseCaseEur)}</p>
        </div>
        <nav class="screen-nav">
          <button type="button" class="btn btn--ghost" data-action="back" data-target="landing">Back</button>
          <button type="button" class="btn btn--primary" data-action="next" data-target="opportunityMap">Opportunity map</button>
        </nav>
      </header>
      <p class="kpi-mode-label" data-testid="kpi-mode">${label} state</p>
      ${renderKpiGrid(kpis, "kpi")}
      ${renderCharts(analysis.charts)}
    </section>
  `;
}
