import type { AppState } from "../app/state.js";
import { renderHeatmapGrid } from "../components/HeatmapGrid.js";

export function renderOpportunityMap(state: AppState): string {
  const analysis = state.analysis;
  if (!analysis) return "";

  const critical = analysis.zones.filter((z) => z.isCritical);

  return `
    <section class="screen screen--opportunity" data-testid="screen-opportunity-map">
      <header class="screen-header">
        <div>
          <p class="screen-header__eyebrow">Opportunity Map</p>
          <h2>Where revenue is hiding</h2>
          <p class="panel-copy">${critical.length} critical zone${critical.length !== 1 ? "s" : ""} identified — darker cells indicate higher revenue opportunity.</p>
        </div>
        <nav class="screen-nav">
          <button type="button" class="btn btn--ghost" data-action="back" data-target="commandCenter">Back</button>
          <button type="button" class="btn btn--primary" data-action="next" data-target="recommendations">AI recommendations</button>
        </nav>
      </header>
      ${renderHeatmapGrid(analysis.zones)}
    </section>
  `;
}
