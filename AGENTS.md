# FleetRevenue Copilot — Agent Coordination

Use this file to run **parallel agents** without merge conflicts. Each workstream owns specific paths; cross-cutting changes go through `packages/shared` first.

## Quick verify (run after every change)

| Scope | Command | ~time |
|-------|---------|-------|
| Full smoke | `npm run verify:smoke` | ~8s |
| API only | `npm run verify:api` | ~3s |
| Web only | `npm run verify:web` | ~4s |
| Shared only | `npm run verify:shared` | ~2s |
| Unit tests (all) | `npm test` | ~5s |
| E2E critical flow | `npm run test:e2e` | ~6s |

**Rule:** Agent that touches `packages/shared` runs `npm run verify:smoke` before handoff. Other agents run their scoped verify.

## Architecture map

```
data/templates/          CSV demo files (rides + leads)
packages/shared/         API ↔ Web contracts (types + guards)
apps/api/src/
  fixtures/              Stub recommendation + simulation data
  routes/                Express routers (health, recommendations, simulations)
  routes/validation.ts   Shared request validation helpers
apps/web/src/
  csv.ts                 CSV parser (client-side)
  dashboardApp.ts        Full UI flow (upload → analyze → simulate)
tests/e2e/               Playwright critical user flow
```

## Workstreams (parallel-safe)

### Agent A — API (`apps/api`)

**Owns:** `apps/api/**` except nothing in `packages/shared` or `apps/web`.

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/health` | GET | — | `{ service, status, timestamp }` |
| `/api/recommendations` | POST | `{ rides?: InputRow[], leads?: InputRow[] }` | `RecommendationResponse` |
| `/api/simulations` | POST | `{ actionId: string }` | `SimulationResponse` |

**Key files:**
- `src/app.ts` — wire routers
- `src/routes/recommendations.ts` — POST handler
- `src/routes/simulations.ts` — POST handler
- `src/fixtures/recommendations.ts` — stub actions + projections (not HTTP routes)
- `test/routes.test.ts` — 7 API tests

**Do not:** change web UI, shared types without coordinating Agent C.

### Agent B — Web (`apps/web`)

**Owns:** `apps/web/**`, `tests/e2e/**` (UI assertions only).

**Key files:**
- `src/dashboardApp.ts` — main UI + state machine
- `src/csv.ts` — CSV import
- `src/style.css` — layout + responsive styles
- `src/dashboardApp.test.ts`, `src/csv.test.ts`, `tests/accessibility-responsive.test.ts`

**API URLs (injectable in tests):**
- `http://localhost:4000/api/recommendations`
- `http://localhost:4000/api/simulations`

**Do not:** change API routes or shared contracts without coordinating Agent C.

### Agent C — Shared contracts (`packages/shared`)

**Owns:** `packages/shared/**` only.

**Exports:** `InputRow`, `RecommendationRequest/Response`, `SimulationRequest/Response`, `ValidationError*`, type guards (`isRecommendationResponse`, etc.).

**Workflow when changing a contract:**
1. Update `packages/shared/src/index.ts`
2. Update `packages/shared/test/contracts.test.ts`
3. Update API route + fixture builders
4. Update web consumer (`dashboardApp.ts`)
5. Update e2e expectations in `tests/e2e/critical-user-flow.spec.ts`
6. Run `npm run verify:smoke && npm run test:e2e`

### Agent D — Data & E2E (`data/`, root `tests/`)

**Owns:** `data/templates/**`, `tests/e2e/**`, `playwright.config.ts`.

Template CSVs must keep 3 data rows (e2e asserts row counts).

## Conflict-free rules

1. **Contracts first** — new fields/types start in `@fleet/shared`, then fan out.
2. **No duplicate types** — web and API import from `@fleet/shared`, never redefine.
3. **Fixtures stay in API** — recommendation stubs live in `fixtures/`, not in routes.
4. **Test IDs are API** — `data-testid` values in `dashboardApp.ts` are consumed by e2e; changing them requires updating `tests/e2e/`.
5. **Ignore `mcps/`** — local MCP descriptors, not part of the app.

## Current MVP status (baseline)

- [x] Health + recommendations + simulations API
- [x] CSV upload (rides + leads) with validation
- [x] KPI cards + action selection + simulation apply
- [x] 32 unit tests + 1 e2e critical flow
- [x] `verify:smoke` (typecheck + build all workspaces)

## Suggested next tasks (split across agents)

| Task | Agent | Files |
|------|-------|-------|
| Real recommendation logic from CSV metrics | A | `fixtures/`, `routes/recommendations.ts` |
| Loading/error UX polish | B | `dashboardApp.ts`, `style.css` |
| Add `isSimulationResponse` guard | C | `packages/shared/src/index.ts` |
| Mobile layout breakpoints | B | `style.css`, `tests/accessibility-responsive.test.ts` |
| API validation for malformed JSON body | A | `app.ts`, `routes.test.ts` |