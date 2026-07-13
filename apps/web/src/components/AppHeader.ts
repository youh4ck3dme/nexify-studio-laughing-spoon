import type { AppState } from "../app/state.js";
import { formatEur } from "../utils/format.js";

export function renderAppHeader(state: AppState): string {
  const showReset = state.analysis !== null;
  const judgeChecked = state.judgeModeOpen ? "checked" : "";

  return `
    <header class="app-header" data-testid="app-header">
      <div class="app-header__brand">
        <span class="app-header__logo">FleetRevenue AI</span>
      </div>
      <div class="app-header__actions">
        <label class="judge-toggle" data-testid="judge-mode-toggle-label">
          <input type="checkbox" data-action="toggle-judge" data-testid="judge-mode-toggle" ${judgeChecked} />
          Judge mode
        </label>
        ${showReset ? `<button type="button" class="btn btn--ghost btn--sm" data-action="reset-demo" data-testid="reset-demo">Reset demo</button>` : ""}
      </div>
    </header>
  `;
}

export function renderPeriodBadge(state: AppState): string {
  const analysis = state.analysis;
  if (!analysis) return "";
  const { period, opportunity } = analysis;
  return `
    <p class="period-badge" data-testid="period-badge">
      ${period.periodDays}-day baseline · ${formatEur(period.monthlyRunRateEur)}/mo run-rate ·
      base-case ${formatEur(opportunity.baseCaseEur)}/mo modeled upside
    </p>
  `;
}
