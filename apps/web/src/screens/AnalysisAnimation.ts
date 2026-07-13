import { ANALYSIS_STEPS, type AppState } from "../app/state.js";
import { escapeHtml } from "../utils/format.js";

export function renderAnalysisAnimation(state: AppState): string {
  const steps = ANALYSIS_STEPS.map((label, i) => {
    const status = i < state.analysisStep ? "done" : i === state.analysisStep ? "active" : "pending";
    return `
      <li class="analysis-step analysis-step--${status}" data-testid="analysis-step-${i}">
        <span class="analysis-step__indicator"></span>
        <span class="analysis-step__label">${escapeHtml(label)}</span>
      </li>
    `;
  }).join("");

  return `
    <section class="screen screen--analyzing" data-testid="screen-analyzing">
      <div class="analysis-panel">
        <h2>Analyzing fleet data</h2>
        <p class="panel-copy">${state.rides.length} rides · ${state.leads.length} leads · ${state.dataSource === "demo" ? "Demo fleet" : "Custom CSV"}</p>
        <ol class="analysis-steps">${steps}</ol>
      </div>
    </section>
  `;
}
