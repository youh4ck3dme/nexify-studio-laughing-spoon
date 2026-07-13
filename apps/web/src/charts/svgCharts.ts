import type { ChartData, WaterfallItem } from "@fleet/shared";
import { escapeHtml } from "../utils/format.js";

const W = 400;
const H = 160;
const PAD = 24;

export function renderRevenueChart(data: ChartData["revenueByDay"]): string {
  if (data.length === 0) return '<p class="chart-empty">No revenue timeline data.</p>';

  const max = Math.max(...data.map((d) => d.revenue), 1);
  const points = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - (d.revenue / max) * (H - PAD * 2);
    return `${x},${y}`;
  });

  return `
    <figure class="chart" data-testid="chart-revenue">
      <figcaption>Revenue over time</figcaption>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue over time line chart showing daily revenue trend">
        <polyline points="${points.join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2" />
        ${data.map((d, i) => {
          const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
          const y = H - PAD - (d.revenue / max) * (H - PAD * 2);
          return `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent)" />`;
        }).join("")}
        <text x="${W / 2}" y="${H - 2}" text-anchor="middle" class="chart-axis" fill="var(--muted)" font-size="10">Days in baseline period</text>
        <text x="8" y="${PAD}" class="chart-axis" fill="var(--muted)" font-size="10">€ revenue</text>
      </svg>
    </figure>
  `;
}

export function renderZoneChart(data: ChartData["utilizationByZone"]): string {
  if (data.length === 0) return '<p class="chart-empty">No zone utilization data.</p>';

  const barH = 20;
  const gap = 8;
  const totalH = data.length * (barH + gap) + PAD * 2;

  const bars = data.map((d, i) => {
    const y = PAD + i * (barH + gap);
    const w = (d.utilizationPct / 100) * (W - PAD * 2 - 40);
    return `
      <text x="${PAD}" y="${y + 14}" class="chart-label" fill="var(--muted)">${escapeHtml(d.zone)}</text>
      <rect x="${PAD + 30}" y="${y}" width="${w}" height="${barH}" rx="4" fill="var(--accent-alt)" opacity="0.85" />
      <text x="${PAD + 35 + w}" y="${y + 14}" class="chart-value" fill="var(--text)">${d.utilizationPct}%</text>
    `;
  });

  return `
    <figure class="chart" data-testid="chart-zones">
      <figcaption>Utilization by zone</figcaption>
      <svg viewBox="0 0 ${W} ${totalH}" role="img" aria-label="Horizontal bar chart of utilization percentage by zone">
        ${bars.join("")}
        <text x="${W / 2}" y="${totalH - 2}" text-anchor="middle" class="chart-axis" fill="var(--muted)" font-size="10">Zone</text>
      </svg>
    </figure>
  `;
}

export function renderFunnelChart(data: ChartData["leadFunnel"]): string {
  if (data.length === 0) return '<p class="chart-empty">No funnel data.</p>';

  const maxW = W - PAD * 2;
  const stepH = 36;

  const steps = data.map((d, i) => {
    const w = (d.pct / 100) * maxW;
    const x = PAD + (maxW - w) / 2;
    const y = PAD + i * stepH;
    return `
      <rect x="${x}" y="${y}" width="${w}" height="${stepH - 4}" rx="4" fill="var(--accent)" opacity="${0.9 - i * 0.15}" />
      <text x="${PAD}" y="${y + 20}" fill="var(--text)" font-size="12">${escapeHtml(d.stage)}: ${d.count} (${d.pct}%)</text>
    `;
  });

  return `
    <figure class="chart" data-testid="chart-funnel">
      <figcaption>Lead → booking → completed</figcaption>
      <svg viewBox="0 0 ${W} ${PAD + data.length * stepH}" role="img" aria-label="Lead conversion funnel from new leads to completed rides">
        ${steps.join("")}
        <text x="${W / 2}" y="${PAD + data.length * stepH - 2}" text-anchor="middle" class="chart-axis" fill="var(--muted)" font-size="10">Conversion stage</text>
      </svg>
    </figure>
  `;
}

export function renderWaterfallChart(items: WaterfallItem[]): string {
  if (items.length === 0) return '<p class="chart-empty">No waterfall data.</p>';

  const max = Math.max(...items.map((i) => i.cumulativeEur), 1);
  const barW = Math.min(60, (W - PAD * 2) / items.length - 8);

  const bars = items.map((item, i) => {
    const h = (item.cumulativeEur / max) * (H - PAD * 2);
    const x = PAD + i * (barW + 8);
    const y = H - PAD - h;
    const color = i === 0 ? "var(--muted)" : item.valueEur >= 0 ? "var(--accent)" : "var(--danger)";
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${color}" rx="3" />
      <text x="${x + barW / 2}" y="${H - 4}" text-anchor="middle" fill="var(--muted)" font-size="9">${escapeHtml(item.label.slice(0, 8))}</text>
    `;
  });

  return `
    <figure class="chart" data-testid="chart-waterfall">
      <figcaption>Revenue bridge</figcaption>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue waterfall chart">
        ${bars.join("")}
      </svg>
    </figure>
  `;
}

export function renderCharts(charts: ChartData): string {
  return `
    <div class="charts-grid">
      ${renderRevenueChart(charts.revenueByDay)}
      ${renderZoneChart(charts.utilizationByZone)}
      ${renderFunnelChart(charts.leadFunnel)}
    </div>
  `;
}
