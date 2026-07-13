# Judge Guide — FleetRevenue AI

## 30-second pitch

Fleet operators lose revenue because ride, vehicle, and lead data live in disconnected CSV exports. **FleetRevenue AI** ingests those exports, computes credible KPIs and zone imbalances, and outputs a prioritized action plan with **modeled** financial upside — base case **€2,297/mo**, up to **€35k/yr** best-case annual (subject to pilot validation). No API keys. Demo runs offline in your browser.

## 3-minute demo script

1. **Landing** — problem statement, trust metrics placeholder
2. Click **Launch demo** — 4-step analysis animation (~2.4s)
3. **Command Center** — KPI cards, charts, period badge (`28-day baseline · €6,092/mo run-rate`)
4. **Opportunity map** — zone heatmap, critical zone A highlighted
5. **AI recommendations** — 3+ actions, one marked “Best next action”
6. **Simulation studio** — drag sliders, show projection table (base/best/worst)
7. Click **Apply best plan** — WOW overlay: annual upside headline, 3-step plan
8. Toggle **Compare scenarios**, then **Executive brief** → expand “Why this recommendation?”

## 5-minute demo script (add)

9. Toggle **Judge mode** — walk through 2–3 Q&A items
10. Click **Reset demo** — back to landing, relaunch → same KPIs (deterministic seed 42)
11. **Upload CSV** — use `data/templates/` or `data/samples/` files
12. Show malformed CSV error handling

## Final KPI numbers (seed 42)

| Metric | Value | Notes |
|--------|-------|-------|
| Revenue | €5,685 | 28-day period Jul 1–28 |
| Utilization | 47.7% | Billable hrs ÷ scheduled vehicle-days |
| Leakage | €855 | Period estimate, de-duplicated from opportunity |
| Base monthly upside | €2,297 | Lead recovery + zone + peak pricing |
| Best / Worst monthly | €2,940 / €1,654 | ×1.28 / ×0.72 multipliers |
| Annual best-case | €35,280 | Best × 12 — **not guaranteed** |

## 10 hardest judge questions

| # | Question | Short answer |
|---|----------|--------------|
| 1 | Real AI? | Rule-based engine today; LLM-ready, not used |
| 2 | Data leaves browser? | Demo: no. API optional in production |
| 3 | How is €2,297 calculated? | 3 de-duplicated components, scaled to 30 days |
| 4 | Why not €18k like before? | Old formula double-counted utilization gap |
| 5 | What period? | 28 days from ride timestamps, shown in UI badge |
| 6 | Utilization definition? | 3h avg booking × completed ÷ (vehicle-days × 9h shift) |
| 7 | Simulation vs real? | Sliders apply capped lifts — directional only |
| 8 | Pilot plan? | 2-week CSV export → baseline → top 2 actions → measure |
| 9 | ICP? | Rental/taxi/mobility/dispatch, 15–50 vehicles |
| 10 | Business model? | SaaS per active vehicle; pilot → rollout |

Toggle **Judge mode** in the app header for full in-app answers.

## Real vs simulated matrix

| Feature | Real (from CSV) | Simulated |
|---------|-----------------|-----------|
| Revenue, utilization, conversion | ✓ | |
| Zone demand/supply map | ✓ | |
| Recommendations + confidence | ✓ (rule-based) | |
| Opportunity base/best/worst | ✓ (formula) | |
| Slider projections | | ✓ (capped) |
| Waterfall chart | | ✓ |
| WOW annual headline | | ✓ (best × 12) |
| Executive brief narrative | ✓ (template) | |

## Red-team notes (what we fixed)

- Utilization denominator now uses **vehicle-days × shift hours**, not a fixed 7-day window
- Opportunity replaced single €18,456 headline with **base/best/worst scenarios**
- Removed “unlocked” language — all copy says “modeled” / “estimated” / “subject to pilot validation”
- Judge Mode + METRICS.md for transparent methodology
