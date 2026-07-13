import type { AppState } from "../app/state.js";
import { renderPeriodBadge } from "../components/AppHeader.js";
import { escapeHtml } from "../utils/format.js";

export function renderExecutiveBrief(state: AppState): string {
  const analysis = state.analysis;
  if (!analysis) return "";

  return `
    <section class="screen screen--brief" data-testid="screen-executive-brief">
      <header class="screen-header">
        <div>
          <p class="screen-header__eyebrow">Executive Brief</p>
          <h2>CEO-ready summary</h2>
          ${renderPeriodBadge(state)}
          <p class="panel-copy">Copy and share with leadership. All figures derived from imported data — subject to pilot validation.</p>
        </div>
        <nav class="screen-nav">
          <button type="button" class="btn btn--ghost" data-action="back" data-target="simulationStudio">Back</button>
          <button type="button" class="btn btn--primary" data-action="copy-brief" data-testid="copy-brief">Copy brief</button>
        </nav>
      </header>

      <pre class="executive-brief" data-testid="executive-brief-text">${escapeHtml(analysis.executiveBrief)}</pre>

      <details class="why-panel" data-testid="why-panel">
        <summary>Why this recommendation?</summary>
        <pre class="why-panel__content">${escapeHtml(analysis.whyExplanation)}</pre>
      </details>

      <p id="copy-status" class="status" role="status" aria-live="polite" data-testid="copy-status"></p>
    </section>
  `;
}
