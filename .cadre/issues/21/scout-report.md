# Scout Report

## Relevant Files

| File | Reason |
|------|--------|
| `packages/db/src/schema.ts` | Must add `notifySlackWebhook` column to `users` and `priceAlerts` tables, and add `channel` column to `alertNotifications` table |
| `packages/db/src/index.ts` | Re-exports all schema; no changes needed but new columns will flow through automatically |
| `packages/api/src/lib/email.ts` | Existing email stub service; Slack service will follow same pattern and may need to call email on invalid webhook |
| `packages/api/src/index.ts` | API entry point; must mount new user alert routes (e.g., `/api/v1/user/me/alerts`) |
| `packages/api/src/routes/auth.ts` | Reference for route patterns, auth flow, and how routes consume Redis/DB; new route file will follow this pattern |
| `packages/api/src/middleware/auth.ts` | Auth middleware needed to protect the test-slack endpoint; no changes needed but must be imported by new route |
| `packages/api/src/lib/validation.ts` | Must add Zod schema for test-slack endpoint request body (webhook URL validation) |
| `packages/api/src/lib/jwt.ts` | Used by auth middleware; no changes needed but referenced by new route's auth flow |
| `packages/api/src/lib/response.ts` | Response envelope utility; no changes needed but may be used by new endpoints |
| `packages/worker/src/queues.ts` | Must add a new `slackNotificationQueue` (or reuse `priceDropQueue`/`allTimeLowQueue` with Slack consumer) |
| `packages/worker/src/index.ts` | Must add a Slack notification worker that consumes price-drop/all-time-low events and dispatches Slack messages; also needs graceful shutdown for the new worker |
| `packages/db/tests/schema.test.ts` | Must update to assert new `notifySlackWebhook` column on `users` and `priceAlerts`, and `channel` column on `alertNotifications` |
| `packages/worker/tests/queues.test.ts` | Must update to assert new Slack notification queue if one is added |
| `.env.example` | Must add `SLACK_ENCRYPTION_KEY` (AES-256 key for webhook URL encryption) |

## Dependency Map

- `packages/db/src/schema.ts` → no local imports (uses drizzle-orm/pg-core)
- `packages/db/src/index.ts` → imports and re-exports `packages/db/src/schema.ts`
- `packages/api/src/index.ts` → imports routes from `packages/api/src/routes/*`, middleware, and `@taad/db`
- `packages/api/src/routes/auth.ts` → imports `packages/api/src/lib/password.ts`, `packages/api/src/lib/jwt.ts`, `packages/api/src/lib/email.ts`, `packages/api/src/lib/validation.ts`, and `@taad/db`
- `packages/api/src/middleware/auth.ts` → imports `packages/api/src/lib/jwt.ts`
- `packages/api/src/lib/email.ts` → standalone (no local imports)
- `packages/api/src/lib/validation.ts` → standalone (uses zod)
- `packages/worker/src/queues.ts` → standalone (uses bullmq)
- `packages/worker/src/index.ts` → imports `packages/worker/src/queues.ts`, `@taad/db`, `@taad/scraper`
- New `packages/api/src/lib/slack.ts` (to be created) → will import `@taad/db` for logging to `alertNotifications`
- New `packages/api/src/lib/encryption.ts` (to be created) → standalone, will use Node.js `crypto` module
- New `packages/api/src/routes/user-alerts.ts` (to be created) → will import auth middleware, validation, slack service, encryption, and `@taad/db`

## Test Files

- `packages/db/tests/schema.test.ts` — covers `schema.ts` (must update for new columns on `users`, `priceAlerts`, `alertNotifications`)
- `packages/api/tests/lib/email.test.ts` — covers `email.ts` (reference pattern for Slack service tests; no changes needed)
- `packages/api/tests/routes/auth.test.ts` — covers `auth.ts` (reference pattern for new route tests; no changes needed)
- `packages/api/tests/lib/validation.test.ts` — covers `validation.ts` (may need update if new schemas added)
- `packages/worker/tests/queues.test.ts` — covers `queues.ts` (must update if new queue is added)
- `packages/worker/tests/index.test.ts` — covers worker `index.ts` (must update for Slack notification worker)
- **Missing:** No test file yet for `packages/api/src/lib/slack.ts` (new file)
- **Missing:** No test file yet for `packages/api/src/lib/encryption.ts` (new file)
- **Missing:** No test file yet for `packages/api/src/routes/user-alerts.ts` (new route)

## Estimated Change Surface

7–10 files require changes. The most complex changes are:

- **`packages/worker/src/index.ts`** (~80 lines): New Slack notification worker with retry logic (exponential backoff, 4xx vs 5xx handling), consuming from price-drop/all-time-low queues and dispatching Slack Block Kit payloads.
- **New `packages/api/src/lib/slack.ts`** (~60 lines): `SlackNotificationService.sendPriceAlert()` — POST to webhook, Block Kit formatting, error classification.
- **New `packages/api/src/lib/encryption.ts`** (~30 lines): AES-256 encrypt/decrypt utility for webhook URLs.
- **New `packages/api/src/routes/user-alerts.ts`** (~50 lines): Test-slack endpoint with auth, validation, encryption.
- **`packages/db/src/schema.ts`** (~10 lines): Add columns to `users`, `priceAlerts`, `alertNotifications`.
- **`packages/worker/src/queues.ts`** (~5 lines): Potentially add `slackNotificationQueue`.
- **`packages/api/src/index.ts`** (~5 lines): Mount new user-alerts route.
- **`packages/api/src/lib/validation.ts`** (~5 lines): Add webhook URL validation schema.
- **`.env.example`** (~2 lines): Add encryption key env var.

Risk areas: `packages/worker/src/index.ts` is the most complex file (400 lines, handles scrape/ingest/stats workers) — adding a Slack worker here increases its surface area. The `alertNotifications` table schema change (adding `channel`) is additive but all existing inserts omit `channel`, so the column must default to `null` or `'email'`. The encryption utility introduces a new shared secret (`SLACK_ENCRYPTION_KEY`) that must be managed securely.

```cadre-json
{
  "relevantFiles": [
    { "path": "packages/db/src/schema.ts", "reason": "Must add notifySlackWebhook column to users and priceAlerts tables, and channel column to alertNotifications table" },
    { "path": "packages/db/src/index.ts", "reason": "Re-exports schema; new columns flow through automatically, no changes needed but must be aware of" },
    { "path": "packages/api/src/lib/email.ts", "reason": "Existing email stub service; Slack service follows same pattern; may need to call email on invalid webhook" },
    { "path": "packages/api/src/index.ts", "reason": "API entry point; must mount new user alert routes" },
    { "path": "packages/api/src/routes/auth.ts", "reason": "Reference for route patterns, auth flow, Redis/DB usage; new route will follow this pattern" },
    { "path": "packages/api/src/middleware/auth.ts", "reason": "Auth middleware needed to protect test-slack endpoint" },
    { "path": "packages/api/src/lib/validation.ts", "reason": "Must add Zod schema for test-slack endpoint webhook URL validation" },
    { "path": "packages/api/src/lib/jwt.ts", "reason": "Used by auth middleware; no changes needed but part of auth chain" },
    { "path": "packages/api/src/lib/response.ts", "reason": "Response envelope utility; may be used by new endpoints" },
    { "path": "packages/worker/src/queues.ts", "reason": "Must add slackNotificationQueue or reuse existing queues with Slack consumer" },
    { "path": "packages/worker/src/index.ts", "reason": "Must add Slack notification worker consuming price-drop/all-time-low events with retry logic" },
    { "path": "packages/db/tests/schema.test.ts", "reason": "Must update assertions for new columns on users, priceAlerts, alertNotifications" },
    { "path": "packages/worker/tests/queues.test.ts", "reason": "Must update if new Slack notification queue is added" },
    { "path": ".env.example", "reason": "Must add SLACK_ENCRYPTION_KEY for AES-256 webhook URL encryption" }
  ],
  "dependencyMap": {
    "packages/db/src/schema.ts": [],
    "packages/db/src/index.ts": ["packages/db/src/schema.ts"],
    "packages/api/src/index.ts": ["packages/api/src/routes/auth.ts", "packages/api/src/routes/deals.ts", "packages/api/src/routes/games.ts", "packages/api/src/routes/stores.ts", "packages/api/src/middleware/rate-limit.ts", "packages/api/src/middleware/cache.ts", "packages/api/src/openapi.ts"],
    "packages/api/src/routes/auth.ts": ["packages/api/src/lib/password.ts", "packages/api/src/lib/jwt.ts", "packages/api/src/lib/email.ts", "packages/api/src/lib/validation.ts"],
    "packages/api/src/middleware/auth.ts": ["packages/api/src/lib/jwt.ts"],
    "packages/api/src/lib/email.ts": [],
    "packages/api/src/lib/validation.ts": [],
    "packages/api/src/lib/jwt.ts": [],
    "packages/api/src/lib/response.ts": [],
    "packages/worker/src/queues.ts": [],
    "packages/worker/src/index.ts": ["packages/worker/src/queues.ts"]
  },
  "testFiles": [
    "packages/db/tests/schema.test.ts",
    "packages/api/tests/lib/email.test.ts",
    "packages/api/tests/routes/auth.test.ts",
    "packages/api/tests/lib/validation.test.ts",
    "packages/worker/tests/queues.test.ts",
    "packages/worker/tests/index.test.ts"
  ],
  "estimatedChanges": [
    { "path": "packages/db/src/schema.ts", "linesEstimate": 10 },
    { "path": "packages/api/src/lib/slack.ts", "linesEstimate": 60 },
    { "path": "packages/api/src/lib/encryption.ts", "linesEstimate": 30 },
    { "path": "packages/api/src/routes/user-alerts.ts", "linesEstimate": 50 },
    { "path": "packages/api/src/index.ts", "linesEstimate": 5 },
    { "path": "packages/api/src/lib/validation.ts", "linesEstimate": 5 },
    { "path": "packages/worker/src/queues.ts", "linesEstimate": 5 },
    { "path": "packages/worker/src/index.ts", "linesEstimate": 80 },
    { "path": ".env.example", "linesEstimate": 2 },
    { "path": "packages/db/tests/schema.test.ts", "linesEstimate": 15 },
    { "path": "packages/worker/tests/queues.test.ts", "linesEstimate": 10 }
  ]
}
```
