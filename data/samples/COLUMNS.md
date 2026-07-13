# Sample CSV columns

## rides-demo.csv

| Column | Type | Description |
|--------|------|-------------|
| `ride_id` | string | Unique ride identifier |
| `zone` | string | Service zone (A–E) |
| `hour_slot` | integer | Hour of day (0–23) |
| `fare` | decimal | Fare amount in EUR |
| `driver_id` | string | Vehicle/driver identifier |
| `status` | string | `completed`, `cancelled`, etc. |
| `timestamp` | ISO 8601 | Ride datetime |

## leads-demo.csv

| Column | Type | Description |
|--------|------|-------------|
| `lead_id` | string | Unique lead identifier |
| `source` | string | `web`, `phone`, `partner`, `app` |
| `priority` | string | `A`, `B`, or `C` |
| `created_at` | ISO 8601 | Lead creation datetime |
| `status` | string | `new`, `contacted`, `converted`, `booked`, `lost` |

## Regenerate

```bash
npm run build -w packages/shared
node scripts/export-demo-csv.mjs
```

Output: `rides-demo.csv` (500 rows) + `leads-demo.csv` (150 rows), deterministic seed 42.
