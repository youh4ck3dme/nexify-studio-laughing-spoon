# FleetRevenue Copilot

Monorepo MVP for fleet revenue optimization: upload rides + leads CSVs, get AI-powered recommendations, and simulate revenue impact of selected actions.

## Structure

| Path | Role |
|------|------|
| `apps/api` | Express API — health, recommendations, simulations |
| `apps/web` | Vite SPA — CSV upload, KPI cards, action selection |
| `packages/shared` | TypeScript contracts + runtime guards (shared by API and web) |
| `api/index.ts` | Vercel serverless entry point (wraps Express app) |
| `data/templates` | Demo CSV files for local dev and e2e tests |
| `tests/e2e` | Playwright critical user flow |
| `scripts/` | Smoke verification + CI helpers |

## Quick start

```bash
npm install
npm run dev
```

- API: http://localhost:4000/health
- Web: http://localhost:5173

## API

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/health` | GET | — | Service health + ISO timestamp |
| `/api/recommendations` | POST | `{ rides?: InputRow[], leads?: InputRow[] }` | Analyze uploaded data, return KPIs + actions |
| `/api/simulations` | POST | `{ actionId: string }` | Project KPI impact for a selected action |

## Verify

```bash
npm run verify:smoke    # typecheck + build (all workspaces)
npm test                # 32 unit tests
npm run test:e2e        # Playwright critical flow (upload → analyze → simulate)

# Per-workspace (faster during parallel development):
npm run verify:api
npm run verify:web
npm run verify:shared
```

## Demo data

Upload the templates in `data/templates/` to run the full flow locally:
- `rides.template.csv` — 3 ride rows
- `leads.template.csv` — 3 lead rows

## Vercel deployment

Both the web UI and API deploy to Vercel in a single step — no separate API host needed.

| Layer | How it deploys |
|-------|---------------|
| Web UI | Static build from `apps/web/dist` (SPA with HTML fallback) |
| API | Serverless function at `api/index.ts`, routed from `/api/*` and `/health` |

### Deploy via GitHub import (recommended)

1. Open: https://vercel.com/new/import?s=https://github.com/youh4ck3dme/nexify-studio-laughing-spoon
2. Select framework: **Other** (`vercel.json` handles everything)
3. Click **Deploy** — no environment variables required

### Deploy via Vercel CLI

```bash
npx vercel --prod
```

### Local build smoke test

```bash
npm run build:vercel    # builds packages/shared + apps/web into apps/web/dist
```

### How it works

`vercel.json` routes `/api/:path*` and `/health` to `api/index.ts` (the Express serverless handler) and SPA-falls back all other paths to `index.html`. In the production Vite build (`import.meta.env.PROD === true`), the web app calls the API using a same-origin relative URL — no `VITE_API_URL` env var needed.

**Local dev override:** copy `apps/web/.env.example` to `apps/web/.env` and set `VITE_API_URL` to point at a different API host.

## Parallel agent development

See [AGENTS.md](./AGENTS.md) for workstream boundaries, owned paths, and fast verify commands per agent (A = API, B = Web, C = Shared, D = Data/E2E).
