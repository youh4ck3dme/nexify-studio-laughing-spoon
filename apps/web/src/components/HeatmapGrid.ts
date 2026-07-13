import type { ZoneMetrics } from "@fleet/shared";
import { escapeHtml, formatEur } from "../utils/format.js";

export function renderHeatmapGrid(zones: ZoneMetrics[]): string {
  if (zones.length === 0) {
    return '<p class="empty-state">No zone data available.</p>';
  }

  const maxOpp = Math.max(...zones.map((z) => z.revenueOpportunity), 1);

  const cells = zones
    .map((zone) => {
      const intensity = Math.round((zone.revenueOpportunity / maxOpp) * 100);
      return `
        <article class="heatmap-cell ${zone.isCritical ? "heatmap-cell--critical" : ""}" data-testid="zone-${escapeHtml(zone.zone)}">
          <header class="heatmap-cell__zone">Zone ${escapeHtml(zone.zone)}</header>
          <div class="heatmap-cell__bar" style="--intensity: ${intensity}"></div>
          <dl class="heatmap-cell__stats">
            <div><dt>Demand</dt><dd>${zone.demand}</dd></div>
            <div><dt>Supply</dt><dd>${zone.supply}</dd></div>
            <div><dt>Idle cap.</dt><dd>${zone.idleCapacity}</dd></div>
            <div><dt>Opportunity</dt><dd>${formatEur(zone.revenueOpportunity)}</dd></div>
          </dl>
          <p class="heatmap-cell__explanation">${escapeHtml(zone.explanation)}</p>
        </article>
      `;
    })
    .join("");

  return `<div class="heatmap-grid" data-testid="opportunity-map">${cells}</div>`;
}
