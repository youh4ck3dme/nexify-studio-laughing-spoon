import type { Recommendation } from "@fleet/shared";
import { escapeHtml, formatEur } from "../utils/format.js";

export function renderActionCard(rec: Recommendation): string {
  const badge = rec.isBestNextAction
    ? '<span class="action-card__badge" data-testid="best-next-action">Best next action</span>'
    : "";

  const evidence = rec.dataEvidence
    .map((e) => `<li>${escapeHtml(e)}</li>`)
    .join("");

  return `
    <article class="action-card ${rec.isBestNextAction ? "action-card--best" : ""}" data-testid="action-${escapeHtml(rec.id)}">
      ${badge}
      <h3 class="action-card__title">${escapeHtml(rec.title)}</h3>
      <p class="action-card__explanation">${escapeHtml(rec.explanation)}</p>
      <div class="action-card__confidence">
        <span>Confidence ${rec.confidenceScore}%</span>
        <div class="confidence-bar"><div class="confidence-bar__fill" style="width: ${rec.confidenceScore}%"></div></div>
      </div>
      <ul class="action-card__evidence">${evidence}</ul>
      <div class="action-card__impact">
        <span>+${formatEur(rec.expectedRevenueLiftEur)} revenue</span>
        <span>−${rec.idleTimeReductionHours}h idle</span>
        <span class="difficulty difficulty--${rec.implementationDifficulty}">${rec.implementationDifficulty}</span>
      </div>
      <details class="action-card__risks">
        <summary>Risks & guardrails</summary>
        <p><strong>Risks:</strong> ${escapeHtml(rec.risks.join("; "))}</p>
        <p><strong>Guardrails:</strong> ${escapeHtml(rec.guardrails.join("; "))}</p>
      </details>
    </article>
  `;
}

export function renderActionList(recommendations: Recommendation[]): string {
  if (recommendations.length === 0) {
    return '<p class="empty-state">No recommendations generated.</p>';
  }
  return `<div class="action-list">${recommendations.map(renderActionCard).join("")}</div>`;
}
