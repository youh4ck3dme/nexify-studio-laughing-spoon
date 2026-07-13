import type { AppState } from "../app/state.js";
import { renderKpiGrid } from "../components/KpiCard.js";
import { renderProjectionTable } from "../components/ProjectionTable.js";
import { escapeHtml, formatEur, formatPct } from "../utils/format.js";

export function renderWowOverlay(state: AppState): string {
  const analysis = state.analysis;
  const sim = state.simulation;
  if (!analysis || !sim || !state.wowApplied) return "";

  const { opportunity } = analysis;

  const steps = sim.threeStepPlan
    .map(
      (s) => `
        <li class="wow-step" data-testid="wow-step-${s.step}">
          <span class="wow-step__num">${s.step}</span>
          <div>
            <strong>${escapeHtml(s.title)}</strong>
            <span class="wow-step__timing">${escapeHtml(s.timing)}</span>
          </div>
        </li>
      `
    )
    .join("");

  const compareBlock = state.compareMode
    ? `
      <div class="wow-compare" data-testid="wow-compare">
        <div class="wow-compare__col" data-testid="wow-current">
          <h3>Current</h3>
          ${renderKpiGrid(sim.current, "wow-current-kpi")}
        </div>
        <div class="wow-compare__col wow-compare__col--projected" data-testid="wow-projected">
          <h3>Projected</h3>
          ${renderKpiGrid(sim.projected, "wow-projected-kpi")}
        </div>
      </div>
    `
    : `<div class="wow-kpis wow-kpis--animated">${renderKpiGrid(sim.projected, "wow")}</div>`;

  return `
    <div class="wow-overlay" data-testid="wow-overlay">
      <div class="wow-overlay__content">
        <p class="wow-overlay__eyebrow">Plan applied</p>
        <h2 class="wow-overlay__headline" data-testid="wow-opportunity">
          Up to ${formatEur(opportunity.annualBestCaseEur)} annual modeled upside (best-case, subject to pilot validation)
        </h2>
        <p class="wow-overlay__sub" data-testid="wow-subhead">
          Base-case ${formatEur(opportunity.baseCaseEur)}/mo · Range ${formatEur(opportunity.worstCaseEur)}–${formatEur(opportunity.bestCaseEur)} · Confidence ${formatPct(opportunity.confidencePct)}
        </p>
        <p class="wow-overlay__disclaimer">Projected impact — simulation, not a guarantee</p>

        ${compareBlock}
        ${renderProjectionTable(opportunity)}

        <ol class="wow-steps">${steps}</ol>

        <div class="wow-actions">
          <button type="button" class="btn btn--primary" data-action="toggle-compare" data-testid="toggle-compare">
            ${state.compareMode ? "Show projected only" : "Compare scenarios"}
          </button>
          <button type="button" class="btn btn--secondary" data-action="reset-baseline" data-testid="reset-baseline">Reset to baseline</button>
          <button type="button" class="btn btn--ghost" data-action="dismiss-wow" data-testid="dismiss-wow">Executive brief</button>
        </div>
      </div>
    </div>
  `;
}
