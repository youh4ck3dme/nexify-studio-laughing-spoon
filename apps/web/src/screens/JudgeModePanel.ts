import type { AppState } from "../app/state.js";
import { escapeHtml } from "../utils/format.js";

const JUDGE_QA: { q: string; a: string }[] = [
  {
    q: "Is this real AI or rule-based logic?",
    a: "Rule-based analytics engine today — deterministic KPIs, zones, and recommendations from CSV data. LLM-ready architecture, no model calls in the demo."
  },
  {
    q: "Does data leave the browser?",
    a: "Demo mode runs fully offline in the browser via Web Worker. CSV upload is analyzed client-side. API routes exist for production but demo needs no API keys."
  },
  {
    q: "How is monthly opportunity calculated?",
    a: "Three de-duplicated components: lead recovery (lost leads × avg fare × 15% capture), zone rebalance (top zone opportunity × 25%), peak pricing (evening fare gap × rides × 8%). Scaled to 30 days from the baseline period."
  },
  {
    q: "Why base / best / worst scenarios?",
    a: "Base = sum of components. Best = ×1.28 capped at 55% of monthly run-rate. Worst = ×0.72. Annual best = best × 12 — explicitly not guaranteed."
  },
  {
    q: "What period do KPIs cover?",
    a: "Derived from ride timestamps in the CSV. Demo seed 42 spans 28 days (Jul 1–28). Revenue and leakage are period totals; run-rate extrapolates to 30 days."
  },
  {
    q: "How is utilization defined?",
    a: "Billable hours (avg 3h per completed booking) ÷ scheduled vehicle-days × 9h shift. Uses actual driver-day pairs from completed rides — not a fixed 7-day window."
  },
  {
    q: "What's real vs simulated?",
    a: "Real: CSV parsing, KPI math, zone mapping, recommendations. Simulated: multi-action sliders, waterfall projections, WOW overlay — capped lifts with disclaimers."
  },
  {
    q: "What would a pilot look like?",
    a: "2-week CSV export from dispatch/rental system → baseline KPI snapshot → apply top 2 actions → measure uplift vs same period prior year."
  },
  {
    q: "Who is the customer?",
    a: "Rental, taxi, mobility, and dispatch teams with disconnected ride/vehicle/lead exports — typically 15–50 active vehicles."
  },
  {
    q: "Business model?",
    a: "SaaS per active vehicle/month. Pilot → measured uplift → fleet-wide rollout. No per-API-call pricing."
  }
];

export function renderJudgeModePanel(state: AppState): string {
  if (!state.judgeModeOpen) return "";

  const items = JUDGE_QA.map(
    (item, i) => `
      <details class="judge-item" data-testid="judge-q-${i + 1}">
        <summary>${escapeHtml(item.q)}</summary>
        <p>${escapeHtml(item.a)}</p>
      </details>
    `
  ).join("");

  return `
    <aside class="judge-panel" data-testid="judge-mode-panel">
      <h2 class="judge-panel__title">Judge mode — quick answers</h2>
      <p class="judge-panel__intro">Ten hardest questions, answered truthfully. Toggle off anytime.</p>
      ${items}
    </aside>
  `;
}

export function loadJudgeModeFromSession(): boolean {
  try {
    return sessionStorage.getItem("fleet-judge-mode") === "1";
  } catch {
    return false;
  }
}

export function saveJudgeModeToSession(open: boolean): void {
  try {
    sessionStorage.setItem("fleet-judge-mode", open ? "1" : "0");
  } catch {
    /* ignore */
  }
}
