import type { OpportunityProjection } from "@fleet/shared";
import { escapeHtml, formatEur } from "../utils/format.js";

export function renderProjectionTable(opportunity: OpportunityProjection): string {
  return `
    <div class="projection-table" data-testid="projection-table">
      <h3 class="projection-table__title">Modeled monthly upside scenarios</h3>
      <table class="projection-table__grid">
        <thead>
          <tr><th>Scenario</th><th>Monthly</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr data-testid="projection-worst">
            <td>Worst case</td>
            <td>${formatEur(opportunity.worstCaseEur)}</td>
            <td>Conservative capture (×0.72)</td>
          </tr>
          <tr data-testid="projection-base">
            <td><strong>Base case</strong></td>
            <td><strong>${formatEur(opportunity.baseCaseEur)}</strong></td>
            <td>Primary estimate</td>
          </tr>
          <tr data-testid="projection-best">
            <td>Best case</td>
            <td>${formatEur(opportunity.bestCaseEur)}</td>
            <td>Optimistic capture (×1.28, capped)</td>
          </tr>
          <tr data-testid="projection-annual">
            <td>Annual best-case</td>
            <td>${formatEur(opportunity.annualBestCaseEur)}</td>
            <td>Best × 12 — subject to pilot validation</td>
          </tr>
        </tbody>
      </table>
      <p class="projection-table__confidence">Confidence range: ±${100 - opportunity.confidencePct}% · ${opportunity.confidencePct}% model confidence</p>
      <ul class="projection-table__assumptions">
        ${opportunity.assumptions.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
      </ul>
    </div>
  `;
}
