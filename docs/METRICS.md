# Metrics — FleetRevenue AI

Every KPI displayed in the UI is computed deterministically from imported CSV rows. This document defines units, period, formulas, and a worked example for demo seed 42.

## Period context

All KPIs share one baseline period inferred from ride timestamps.

| Field | Definition |
|-------|------------|
| `periodDays` | Days between earliest and latest ride date (+1) |
| `periodLabel` | Human-readable range, e.g. `1 Jul–28 Jul (28 days)` |
| `monthlyRunRateEur` | `revenue × (30 / periodDays)` |

**Demo seed 42:** 28 days, €5,685.42 revenue → €6,091.52/mo run-rate.

## Fleet KPIs

### Revenue (`kpis.revenue`)

- **Unit:** EUR, period total
- **Formula:** Sum of `fare` for rides where `status = completed`
- **Demo:** €5,685.42 (382 completed rides)

### Utilization (`kpis.utilizationPct`)

- **Unit:** Percentage
- **Period:** Same as baseline
- **Formula:**
  ```
  vehicleDays = unique (driver_id, date) pairs from completed rides
  rideHours    = completed_count × 3h (avg billable booking duration)
  scheduledHrs = vehicleDays × 9h (typical shift length)
  utilization  = rideHours / scheduledHrs × 100
  ```
- **Target:** 78% (industry benchmark shown for comparison)
- **Demo:** 47.7% — realistic “struggling fleet”

### Idle hours (`kpis.idleHours`)

- **Unit:** Hours, period total
- **Formula:** `scheduledHrs - rideHours` (same vehicle-day basis as utilization)

### Lead conversion (`kpis.leadConversionPct`)

- **Unit:** Percentage
- **Formula:** `(converted + booked + completed leads) / total leads × 100`
- **Target:** 42%

### Estimated leakage (`kpis.estimatedLeakageEur`)

- **Unit:** EUR, period total
- **Formula:** Composite of:
  - Lost/new leads × avg fare × conversion gap × 0.6
  - Idle hours × 0.03 × avg revenue per vehicle-hour
  - Peak-hour missed rides × avg fare × 0.2
- **Note:** De-duplicated from opportunity components — not additive with monthly upside
- **Demo:** €855.25

## Opportunity projection

Replaces the old single `monthlyOpportunityEur` headline. Three **mutually exclusive** components, scaled to 30 days:

### Components (period-scoped, then × 30/periodDays)

| Component | Formula | Demo (period) |
|-----------|---------|---------------|
| Lead recovery | `lostLeads × avgFare × 15%` | 98 × €14.88 × 0.15 = €219 |
| Zone rebalance | `topZone.revenueOpportunity × 25%` | €7,696 × 0.25 = €1,924 |
| Peak pricing | `fareGap × eveningCompleted × 8%` | €0.10 × 157 × 0.08 = €1.26 |

### Scenarios

| Scenario | Multiplier | Cap | Demo monthly |
|----------|------------|-----|--------------|
| Base | ×1.0 | 55% of run-rate | **€2,297** |
| Best | ×1.28 | 55% of run-rate | **€2,940** |
| Worst | ×0.72 | none | **€1,654** |
| Annual best | best × 12 | — | **€35,280** |

**Cap:** `monthlyRunRateEur × 0.55` = €3,350 — base case stays below cap.

### Confidence

`confidencePct: 72` → UI shows ±28% uncertainty band note. Figures are simulations, not guarantees.

## Zone metrics

| Field | Definition |
|-------|------------|
| `demand` | Total ride rows in zone |
| `supply` | Unique drivers serving zone |
| `revenueOpportunity` | Critical zones: `revenue × (demand/supply - 1) × 0.35`; others: idle/unmet demand based |
| `isCritical` | demand/supply > 1.3 OR peak demand > 2× supply |

**Demo top zone:** Zone A — €7,696 opportunity (high demand/supply ratio).

## Simulation metrics

When user adjusts sliders or applies best plan:

| Rule | Value |
|------|-------|
| Max revenue lift | +25% of baseline period revenue |
| Max utilization lift | +15 percentage points |
| Max conversion lift | +20 percentage points |
| Revenue leakage reduction | 60% of applied revenue lift |

All simulation outputs include `isSimulation: true` and assumption disclaimers.

## Worked example (seed 42)

```
Input:  500 rides, 150 leads, 22 drivers, seed 42
Period: Jul 1–28, 2026 (28 days)

Output:
  revenue              €5,685.42
  utilization          47.7%
  leakage              €855.25
  lead conversion      ~31%
  opportunity.base     €2,297/mo
  opportunity.best     €2,940/mo
  opportunity.worst    €1,654/mo
  opportunity.annual   €35,280/yr (best × 12)
```

## What we removed (red-team)

| Old | Problem | New |
|-----|---------|-----|
| `monthlyOpportunityEur = €18,456` | ~3.2× monthly run-rate, double-counted utilization gap | `opportunity.baseCaseEur = €2,297` |
| Utilization denominator × 7 days | 1-week capacity vs 28-day revenue | Vehicle-days × 9h shift |
| “Unlocked” copy | Implied guarantee | “Modeled upside, subject to pilot validation” |

## Verification

Deterministic values are locked in unit tests:

- `packages/shared/test/monthlyOpportunity.test.ts`
- `packages/shared/test/analytics.test.ts` (utilization 47.7%)
- `packages/shared/test/parity.test.ts` (repeatability)

Run: `npm run verify:shared`
