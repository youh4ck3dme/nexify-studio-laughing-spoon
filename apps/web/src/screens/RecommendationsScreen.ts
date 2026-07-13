import type { AppState } from "../app/state.js";
import { renderActionList } from "../components/ActionCard.js";

export function renderRecommendations(state: AppState): string {
  const analysis = state.analysis;
  if (!analysis) return "";

  return `
    <section class="screen screen--recommendations" data-testid="screen-recommendations">
      <header class="screen-header">
        <div>
          <p class="screen-header__eyebrow">AI Recommendations</p>
          <h2>Prioritized action plan</h2>
          <p class="panel-copy">${analysis.recommendations.length} actions derived from your fleet data — not static templates.</p>
        </div>
        <nav class="screen-nav">
          <button type="button" class="btn btn--ghost" data-action="back" data-target="opportunityMap">Back</button>
          <button type="button" class="btn btn--primary" data-action="next" data-target="simulationStudio">Simulation studio</button>
        </nav>
      </header>
      ${renderActionList(analysis.recommendations)}
    </section>
  `;
}
