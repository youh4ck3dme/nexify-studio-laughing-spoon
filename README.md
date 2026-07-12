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

## Vercel deployment

Both the web UI and API deploy to Vercel in one step:

- **Web** — static build from `apps/web/dist` (SPA)
- **API** — serverless function at `api/index.ts` (routes `/api/*`)

```bash
npm run build:vercel   # local smoke
```

**Deploy via Vercel + GitHub (recommended):**

1. Import fork: https://vercel.com/new/import?s=https://github.com/youh4ck3dme/nexify-studio-laughing-spoon
2. Framework: Other (uses `vercel.json`)
3. Deploy — no env vars needed

`vercel.json` wires `/api/:path*` to the Express serverless function (`api/index.ts`) and SPA-falls back to `index.html`. Production build uses same-origin API (`import.meta.env.PROD` → empty base URL).

**Local dev:** `npm run dev` (API on :4000, web on :5173). Override API base via `apps/web/.env`.