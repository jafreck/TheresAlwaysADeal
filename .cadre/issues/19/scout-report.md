# Scout Report

## Relevant Files

| File | Reason |
|------|--------|
| `packages/db/src/schema.ts` | Contains the `priceAlerts` table (line 106-114) that must be expanded with `storeId`, `targetPriceCents`, `targetDiscountPercent`, `notifyEmail`, `notifySlackWebhook` columns; also contains `alertNotifications` table that may need updates |
| `packages/api/src/routes/alerts.ts` | **New file** — implements GET/POST/PATCH/DELETE CRUD + pause endpoints for `/api/user/me/alerts` |
| `packages/api/src/index.ts` | Must mount the new alerts route under the v1 router with auth middleware |
| `packages/api/src/lib/validation.ts` | Must add Zod schemas for alert creation (`createAlertSchema`) and update (`updateAlertSchema`) payloads |
| `packages/api/src/middleware/auth.ts` | Existing auth middleware to reuse on alert endpoints; no changes expected |
| `packages/api/src/lib/jwt.ts` | Provides `verifyAccessToken` used by auth middleware; no changes expected but relevant for understanding auth flow |
| `packages/worker/src/index.ts` | Must add alert evaluation logic inside the ingest worker after price-drop/all-time-low detection (around lines 259-305) to query active `priceAlerts` and evaluate trigger conditions |
| `packages/worker/src/queues.ts` | May need a new `notificationQueue` for enqueuing notification jobs when alerts trigger |
| `packages/db/src/index.ts` | Re-exports all schema tables; new schema exports will be automatically available via `@taad/db` |
| `packages/api/src/openapi.ts` | Should be updated with OpenAPI specs for the new alert endpoints |
| `packages/api/src/lib/response.ts` | Provides `buildEnvelopeResponse` helper that will be used by alert list endpoint |
| `.env.example` | Should add `ENCRYPTION_KEY` env var for Slack webhook encryption |

## Dependency Map

- `packages/api/src/routes/alerts.ts` (new) imports:
  - `@taad/db` → `db`, `priceAlerts`, `games` (for gameId validation)
  - `../lib/validation.js` → `createAlertSchema`, `updateAlertSchema` (new schemas)
  - `../lib/response.js` → `buildEnvelopeResponse`
  - `../middleware/auth.js` → `authMiddleware`
  - `hono` framework
- `packages/api/src/index.ts` imports:
  - `./routes/alerts.js` (new import to mount)
  - Already imports `./middleware/auth.js` indirectly through route files
- `packages/api/src/lib/validation.ts` imports:
  - `zod` (already imported)
- `packages/db/src/schema.ts` imports:
  - `drizzle-orm/pg-core` (already imported; may need additional column types like `text` for encrypted webhook)
- `packages/worker/src/index.ts` imports:
  - `@taad/db` → will need to additionally import `priceAlerts`, `alertNotifications`
  - `./queues.js` → may import new `notificationQueue`
- `packages/worker/src/queues.ts` imports:
  - `bullmq` (already imported)

## Test Files

- `packages/db/tests/schema.test.ts` — covers `priceAlerts` table columns (lines 177-196); **must be updated** to verify new columns (`storeId`, `targetPriceCents`, `targetDiscountPercent`, `notifyEmail`, `notifySlackWebhook`)
- `packages/api/tests/lib/validation.test.ts` — covers all existing validation schemas; **must be updated** with tests for new `createAlertSchema` and `updateAlertSchema`
- `packages/api/tests/routes/auth.test.ts` — covers auth routes; useful as a **pattern reference** for new alert route tests (mocking DB, auth, etc.)
- `packages/worker/tests/index.test.ts` — covers worker ingest logic; **should be updated** to test alert evaluation logic
- `packages/worker/tests/queues.test.ts` — covers queue definitions; **should be updated** if a new `notificationQueue` is added
- `packages/api/tests/routes/alerts.test.ts` — **does not exist yet**; must be created for alert CRUD endpoint tests
- `packages/worker/tests/alert-evaluation.test.ts` — **does not exist yet**; should be created for unit tests on alert trigger condition evaluation logic (requirement #13)
- `packages/api/tests/middleware/auth.test.ts` — covers auth middleware; no changes expected

## Estimated Change Surface

8–10 files require changes (plus 2 new files). `packages/worker/src/index.ts` is the most complex change — alert evaluation logic must be integrated into the existing ingest worker flow after price-change detection (~50–80 lines). `packages/api/src/routes/alerts.ts` is a new file with 5 endpoints (~150–200 lines) but follows established patterns from `auth.ts`. `packages/db/src/schema.ts` is a moderate-risk change because `priceAlerts` is referenced by `alertNotifications` via a foreign key, and the existing `targetPrice` column likely needs renaming/replacing. `packages/api/src/lib/validation.ts` is low-risk (additive Zod schemas). The Slack webhook encryption adds cross-cutting complexity — a new encryption utility may be needed. Risk areas: the `priceAlerts` schema change is shared between API and worker packages, and the ingest worker is a high-traffic code path.

```cadre-json
{
  "relevantFiles": [
    { "path": "packages/db/src/schema.ts", "reason": "Contains priceAlerts table that must be expanded with storeId, targetPriceCents, targetDiscountPercent, notifyEmail, notifySlackWebhook columns; alertNotifications table may also need updates" },
    { "path": "packages/api/src/routes/alerts.ts", "reason": "New file — implements GET/POST/PATCH/DELETE CRUD + pause endpoints for price alerts" },
    { "path": "packages/api/src/index.ts", "reason": "Must mount the new alerts route under the v1 router with auth middleware" },
    { "path": "packages/api/src/lib/validation.ts", "reason": "Must add Zod schemas for alert creation and update request bodies" },
    { "path": "packages/api/src/middleware/auth.ts", "reason": "Existing auth middleware reused on alert endpoints; no changes expected" },
    { "path": "packages/api/src/lib/jwt.ts", "reason": "Provides verifyAccessToken used by auth middleware; no changes expected but dependency of auth flow" },
    { "path": "packages/worker/src/index.ts", "reason": "Must add alert evaluation logic inside the ingest worker after price-drop/all-time-low detection" },
    { "path": "packages/worker/src/queues.ts", "reason": "May need a new notificationQueue for enqueuing notification jobs when alerts trigger" },
    { "path": "packages/db/src/index.ts", "reason": "Re-exports all schema tables; new exports automatically available via @taad/db" },
    { "path": "packages/api/src/openapi.ts", "reason": "Should be updated with OpenAPI specs for new alert endpoints" },
    { "path": "packages/api/src/lib/response.ts", "reason": "Provides buildEnvelopeResponse helper used by alert list endpoint" },
    { "path": ".env.example", "reason": "Should add ENCRYPTION_KEY env var for Slack webhook encryption at rest" }
  ],
  "dependencyMap": {
    "packages/api/src/routes/alerts.ts": ["packages/db/src/schema.ts", "packages/api/src/lib/validation.ts", "packages/api/src/lib/response.ts", "packages/api/src/middleware/auth.ts"],
    "packages/api/src/index.ts": ["packages/api/src/routes/alerts.ts", "packages/api/src/middleware/auth.ts"],
    "packages/api/src/lib/validation.ts": [],
    "packages/api/src/middleware/auth.ts": ["packages/api/src/lib/jwt.ts"],
    "packages/api/src/lib/jwt.ts": [],
    "packages/api/src/lib/response.ts": [],
    "packages/db/src/schema.ts": [],
    "packages/db/src/index.ts": ["packages/db/src/schema.ts"],
    "packages/worker/src/index.ts": ["packages/db/src/schema.ts", "packages/worker/src/queues.ts"],
    "packages/worker/src/queues.ts": [],
    "packages/api/src/openapi.ts": [],
    ".env.example": []
  },
  "testFiles": [
    "packages/db/tests/schema.test.ts",
    "packages/api/tests/lib/validation.test.ts",
    "packages/api/tests/routes/auth.test.ts",
    "packages/worker/tests/index.test.ts",
    "packages/worker/tests/queues.test.ts",
    "packages/api/tests/middleware/auth.test.ts"
  ],
  "estimatedChanges": [
    { "path": "packages/db/src/schema.ts", "linesEstimate": 15 },
    { "path": "packages/api/src/routes/alerts.ts", "linesEstimate": 200 },
    { "path": "packages/api/src/index.ts", "linesEstimate": 10 },
    { "path": "packages/api/src/lib/validation.ts", "linesEstimate": 30 },
    { "path": "packages/worker/src/index.ts", "linesEstimate": 60 },
    { "path": "packages/worker/src/queues.ts", "linesEstimate": 10 },
    { "path": "packages/api/src/openapi.ts", "linesEstimate": 80 },
    { "path": ".env.example", "linesEstimate": 3 },
    { "path": "packages/db/tests/schema.test.ts", "linesEstimate": 15 },
    { "path": "packages/api/tests/lib/validation.test.ts", "linesEstimate": 60 },
    { "path": "packages/api/tests/routes/alerts.test.ts", "linesEstimate": 200 },
    { "path": "packages/worker/tests/alert-evaluation.test.ts", "linesEstimate": 100 }
  ]
}
```
