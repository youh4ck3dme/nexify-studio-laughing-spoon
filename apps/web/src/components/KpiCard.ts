import type { FleetKpis, KpiTrend } from "@fleet/shared";
import { escapeHtml, formatEur, formatPct, formatTrend } from "../utils/format.js";

export function renderKpiCard(opts: {
  label: string;
  value: string;
  trend: KpiTrend;
  target: string;
  explanation: string;
  testId: string;
  highlight?: boolean;
}): string {
  const trendClass = opts.trend.direction === "up" ? "trend-up" : opts.trend.direction === "down" ? "trend-down" : "trend-flat";
  return `
    <article class="kpi-card ${opts.highlight ? "kpi-card--highlight" : ""}" data-testid="${escapeHtml(opts.testId)}">
      <header class="kpi-card__header">
        <span class="kpi-card__label">${escapeHtml(opts.label)}</span>
        <span class="kpi-card__trend ${trendClass}">${escapeHtml(formatTrend(opts.trend.direction, opts.trend.deltaPct))}</span>
      </header>
      <p class="kpi-card__value">${escapeHtml(opts.value)}</p>
      <p class="kpi-card__target">Target: ${escapeHtml(opts.target)}</p>
      <p class="kpi-card__explanation">${escapeHtml(opts.explanation)}</p>
    </article>
  `;
}

export function renderKpiGrid(kpis: FleetKpis, prefix = "kpi"): string {
  return `
    <div class="kpi-grid">
      ${renderKpiCard({
        label: "Revenue",
        value: formatEur(kpis.revenue),
        trend: kpis.trends.revenue,
        target: formatEur(kpis.targets.revenue),
        explanation: "Total fare from completed rides in period.",
        testId: `${prefix}-revenue`
      })}
      ${renderKpiCard({
        label: "Utilization",
        value: formatPct(kpis.utilizationPct),
        trend: kpis.trends.utilization,
        target: formatPct(kpis.targets.utilizationPct),
        explanation: "Active ride hours vs available fleet capacity.",
        testId: `${prefix}-utilization`
      })}
      ${renderKpiCard({
        label: "Idle hours",
        value: `${kpis.idleHours.toFixed(0)}h`,
        trend: kpis.trends.idleHours,
        target: `${kpis.targets.idleHours.toFixed(0)}h`,
        explanation: "Vehicle-hours without completed rides.",
        testId: `${prefix}-idle`
      })}
      ${renderKpiCard({
        label: "Lead conversion",
        value: formatPct(kpis.leadConversionPct),
        trend: kpis.trends.conversion,
        target: formatPct(kpis.targets.leadConversionPct),
        explanation: "Leads converted to completed rides.",
        testId: `${prefix}-conversion`
      })}
      ${renderKpiCard({
        label: "Est. leakage",
        value: formatEur(kpis.estimatedLeakageEur),
        trend: { direction: "down", deltaPct: 0 },
        target: formatEur(0),
        explanation: "Revenue lost to idle capacity and unconverted leads.",
        testId: `${prefix}-leakage`,
        highlight: true
      })}
    </div>
  `;
}
