import type { AppState } from "../app/state.js";
import { renderKpiGrid } from "../components/KpiCard.js";
import { renderPeriodBadge } from "../components/AppHeader.js";
import { renderProjectionTable } from "../components/ProjectionTable.js";
import { renderWaterfallChart } from "../charts/svgCharts.js";
import { escapeHtml, formatEur } from "../utils/format.js";

export function renderSimulationStudio(state: AppState): string {
  const analysis = state.analysis;
  if (!analysis) return "";

  const sim = state.simulation;
  const sliders = state.simulationSelections
    .map((sel) => {
      const rec = analysis.recommendations.find((r) => r.id === sel.actionId);
      if (!rec) return "";
      return `
        <div class="sim-control" data-testid="sim-control-${escapeHtml(sel.actionId)}">
          <label class="sim-control__label">
            <input type="checkbox" data-sim-toggle="${escapeHtml(sel.actionId)}" ${sel.enabled ? "checked" : ""} />
            ${escapeHtml(rec.title)}
          </label>
          <input type="range" min="0" max="100" value="${sel.intensity}" data-sim-intensity="${escapeHtml(sel.actionId)}" data-testid="sim-slider-${escapeHtml(sel.actionId)}" ${sel.enabled ? "" : "disabled"} />
          <span class="sim-control__value">${sel.intensity}%</span>
        </div>
      `;
    })
    .join("");

  return `
    <section class="screen screen--simulation" data-testid="screen-simulation">
      <header class="screen-header">
        <div>
          <p class="screen-header__eyebrow">Simulation Studio</p>
          <h2>Current vs. projected</h2>
          ${renderPeriodBadge(state)}
          <p class="panel-copy simulation-disclaimer">Projected impact — simulation, not a guarantee. Deterministic estimates with ±15% uncertainty.</p>
        </div>
        <nav class="screen-nav">
          <button type="button" class="btn btn--ghost" data-action="back" data-target="recommendations">Back</button>
          <button type="button" class="btn btn--primary" data-action="apply-best-plan" data-testid="apply-best-plan">Apply best plan</button>
          <button type="button" class="btn btn--secondary" data-action="next" data-target="executiveBrief">Executive brief</button>
        </nav>
      </header>

      <div class="sim-sliders">${sliders}</div>

      <div class="sim-comparison">
        <div class="sim-column" data-testid="sim-current">
          <h3>Current</h3>
          ${renderKpiGrid(sim?.current ?? analysis.kpis, "sim-current")}
        </div>
        <div class="sim-column" data-testid="sim-projected">
          <h3>Projected</h3>
          ${renderKpiGrid(sim?.projected ?? analysis.kpis, "sim-projected")}
        </div>
      </div>

      ${sim ? renderWaterfallChart(sim.waterfall) : ""}
      ${renderProjectionTable(analysis.opportunity)}
    </section>
  `;
}
