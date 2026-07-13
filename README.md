# FleetRevenue AI

Turn fleet ride and lead exports into prioritized, measurable revenue actions — a hackathon-ready demo deployable on Vercel with no API keys.

## What it does

1. **Launch demo** or **upload CSV** (rides + leads)
2. **Analyze** fleet KPIs, zone imbalances, and leakage
3. **Recommend** prioritized actions with confidence scores
4. **Simulate** multi-action plans with sliders and waterfall chart
5. **Executive brief** — CEO-ready summary with transparent methodology

Demo mode runs **fully offline** in the browser (Web Worker). Production API uses the same `@fleet/shared` analytics engine.

## Quick start

```bash
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Web UI | http://localhost:5173 |
| API | http://localhost:4000/health |

## Architecture

```
packages/shared/     Single analytics engine (KPIs, zones, opportunity, simulation)
apps/web/            Vite SPA — 7-screen demo flow + Judge Mode
apps/api/            Express API on Vercel serverless
data/samples/        Deterministic demo CSV export (seed 42)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the hybrid browser/API diagram.

## Demo KPIs (seed 42, after judge-proof fix)

| Metric | Value |
|--------|-------|
| Revenue (28 days) | €5,685 |
| Utilization | 47.7% |
| Base monthly upside | €2,297/mo |
| Best / Worst | €2,940 / €1,654 |
| Annual best-case (WOW) | €35,280/yr |

All figures are **modeled estimates** — subject to pilot validation. See [docs/METRICS.md](docs/METRICS.md).

## API

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/health` | GET | — | `{ service, status, timestamp }` |
| `/api/recommendations` | POST | `{ rides?, leads? }` | `AnalysisResponse` |
| `/api/simulations` | POST | `{ actions, baselineKpis, recommendations }` | `SimulationResponse` |

## Verify

```bash
npm run verify:smoke    # typecheck + build all workspaces (~8s)
npm test                # unit tests (~45+)
npm run test:e2e        # Playwright critical flows
npm run build:vercel    # production web build
```

## Sample data

```bash
node scripts/export-demo-csv.mjs   # regenerates data/samples/*.csv
```

- `data/samples/rides-demo.csv` — 500 rides, 22 drivers, 28-day period
- `data/samples/leads-demo.csv` — 150 leads
- `data/templates/` — minimal 3-row templates for e2e CSV upload test

## Judge Mode

Toggle **Judge mode** in the header for 10 pre-written Q&A answers (real vs simulated, methodology, pilot plan). Persists in `sessionStorage`.

## Deploy (Vercel)

```bash
npm run verify:smoke && npm test && npm run test:e2e && npm run build:vercel
npx vercel --prod
```

Project: `fleetrevenue-copilot`. No environment variables required for demo.

## Privacy

- Demo analysis runs in-browser; CSV data is not sent to external services
- No LLM calls, no third-party analytics in demo mode
- API routes available for server-side analysis when deployed

## Limits & roadmap

- Rule-based recommendations (LLM-ready architecture, not wired today)
- Simulation caps revenue lift at +25% of baseline period
- Opportunity capped at 55% of monthly run-rate
- Roadmap: live dispatch integration, A/B pilot tracking, LLM narrative layer

## Docs for judges

- [docs/JUDGES.md](docs/JUDGES.md) — pitch script, demo flow, Q&A
- [docs/METRICS.md](docs/METRICS.md) — every KPI definition + worked example
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system diagram, privacy boundaries

## License

Private hackathon submission.
