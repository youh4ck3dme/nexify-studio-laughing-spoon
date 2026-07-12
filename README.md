# FleetRevenue Copilot

Monorepo MVP for fleet revenue optimization: upload rides + leads CSVs, get recommendations, simulate actions.

## Structure

| Path | Role |
|------|------|
| `apps/api` | Express API — health, recommendations, simulations |
| `apps/web` | Vite dashboard — CSV import, KPIs, action selection |
| `packages/shared` | Shared TypeScript contracts + runtime guards |
| `data/templates` | Demo CSV templates for local dev and e2e |
| `tests/e2e` | Playwright critical user flow |

**Parallel agents:** see [AGENTS.md](./AGENTS.md) for workstream boundaries and fast verify commands.

## Quick start

```bash
npm install
npm run dev
```

- API: http://localhost:4000/health
- Web: http://localhost:5173 (Vite dev) or http://localhost:4173 (`npm run start -w apps/web`)

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health + ISO timestamp |
| `/api/recommendations` | POST | Analyze uploaded rides/leads rows |
| `/api/simulations` | POST | Project KPI impact for a selected action |

## Verify

```bash
npm run verify:smoke    # typecheck + build (all workspaces)
npm test                # unit tests (32 tests)
npm run test:e2e        # Playwright critical flow

# Scoped (faster for parallel work):
npm run verify:api
npm run verify:web
npm run verify:shared
```

## Demo data

Use templates in `data/templates/`:
- `rides.template.csv` — 3 ride rows
- `leads.template.csv` — 3 lead rows