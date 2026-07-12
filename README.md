# FleetRevenue Copilot (Skeleton)

Monorepo skeleton for a hackathon MVP:
- `apps/api`: recommendation API (dispatch, pricing, lead priority)
- `apps/web`: dashboard UI (upload -> insights -> apply action)
- `packages/shared`: shared types
- `data/templates`: CSV templates for demo data

## Quick start

```bash
npm install
npm run dev
```

Final smoke verification:

```bash
npm run verify:smoke
```

## MVP scope (current skeleton)

1. Health endpoint: `GET /health`
2. Recommendation endpoint: `POST /api/recommendations`
3. Web UI with:
   - quick KPI cards
   - action buttons
   - stub "import CSV" placeholders
