import type { AppState } from "../app/state.js";
import { formatEur } from "../utils/format.js";

export function renderLanding(state: AppState): string {
  const lostLeads = state.analysis
    ? state.analysis.leadsImported > 0
      ? state.analysis.leadsImported -
        Math.round((state.analysis.kpis.leadConversionPct / 100) * state.analysis.leadsImported)
      : 0
    : null;

  const trustMetrics = state.analysis
    ? `
      <div class="trust-metrics" data-testid="trust-metrics">
        <div class="trust-metric"><span class="trust-metric__value">${formatEur(state.analysis.opportunity.baseCaseEur)}</span><span class="trust-metric__label">Base-case monthly upside</span></div>
        <div class="trust-metric"><span class="trust-metric__value">${state.analysis.kpis.utilizationPct}%</span><span class="trust-metric__label">Fleet utilization</span></div>
        <div class="trust-metric"><span class="trust-metric__value">${lostLeads}</span><span class="trust-metric__label">Lost leads (period)</span></div>
      </div>
    `
    : `
      <div class="trust-metrics trust-metrics--placeholder">
        <div class="trust-metric"><span class="trust-metric__value">€—</span><span class="trust-metric__label">Base-case monthly upside</span></div>
        <div class="trust-metric"><span class="trust-metric__value">—%</span><span class="trust-metric__label">Fleet utilization</span></div>
        <div class="trust-metric"><span class="trust-metric__value">—</span><span class="trust-metric__label">Lost leads (period)</span></div>
      </div>
    `;

  return `
    <section class="screen screen--landing" data-testid="screen-landing">
      <div class="hero">
        <p class="hero__eyebrow">Fleet operations intelligence</p>
        <h1 class="hero__title">FleetRevenue AI</h1>
        <p class="hero__tagline">Turn fleet exports into prioritized, measurable actions.</p>
        <p class="hero__problem">Fleet operators lose revenue because ride, vehicle and lead data live in disconnected exports.</p>
        <p class="hero__copy">Upload rides and leads CSVs, or launch the demo fleet. Deterministic analysis identifies leakage, zone imbalances, and a prioritized action plan — no API keys required.</p>
        <p class="hero__icp">Built for rental, taxi, mobility, and dispatch teams · SaaS per active vehicle · pilot → measured uplift → rollout</p>
        ${trustMetrics}
        <div class="hero__actions">
          <button type="button" class="btn btn--primary" data-action="load-demo" data-testid="load-demo">Launch demo</button>
          <button type="button" class="btn btn--secondary" data-action="show-upload" data-testid="show-upload">Upload CSV</button>
        </div>
        <div class="upload-panel ${state.uploadPanelOpen ? "" : "hidden"}" id="upload-panel" data-testid="upload-panel">
          <div class="upload-row">
            <label class="upload-field">Rides CSV<input type="file" accept=".csv" data-testid="rides-file-input" data-input="rides" /></label>
            <label class="upload-field">Leads CSV<input type="file" accept=".csv" data-testid="leads-file-input" data-input="leads" /></label>
          </div>
          <button type="button" class="btn btn--primary" data-action="analyze-csv" data-testid="analyze-csv" disabled>Analyze uploaded data</button>
        </div>
        ${state.error ? `<p class="error-banner" role="alert">${state.error}</p>` : ""}
      </div>
    </section>
  `;
}
