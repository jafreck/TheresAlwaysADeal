# Scout Report

## Relevant Files

| File | Reason |
|------|--------|
| `packages/api/src/lib/email.ts` | Current stub email service — must be replaced with real Resend-based EmailService implementation (`sendVerificationEmail`, `sendPasswordResetEmail`, `sendPriceAlert`) |
| `packages/worker/src/queues.ts` | Defines BullMQ queues — needs a new `notificationQueue` (or `emailQueue`) for email send jobs |
| `packages/worker/src/index.ts` | Ingest worker emits `priceDropQueue`/`allTimeLowQueue` events — must wire these to produce notification/email jobs; needs new email worker consumer and graceful shutdown update |
| `packages/db/src/schema.ts` | `alertNotifications` table needs additional columns (`emailStatus`, `emailMessageId`, `emailProvider`) for send logging; `priceAlerts` table is referenced for alert lookups |
| `packages/api/src/routes/auth.ts` | Already calls `sendVerificationEmail`/`sendPasswordResetEmail` from email stub — imports will change when real implementation is wired |
| `packages/api/src/index.ts` | API entry point — needs a new unsubscribe route mounted (e.g., `/api/v1/alerts/unsubscribe`) |
| `packages/scraper/src/referral.ts` | `buildReferralUrl()` utility for affiliate links — will be consumed by email templates to generate per-store buy links |
| `packages/api/src/lib/jwt.ts` | JWT signing utilities — may be extended or referenced for signed unsubscribe tokens |
| `packages/api/src/lib/validation.ts` | Zod validation schemas — needs a new schema for the unsubscribe endpoint |
| `packages/db/src/index.ts` | DB client and re-exports — new schema columns will flow through automatically |
| `.env.example` | Must add `EMAIL_FROM`, `EMAIL_PROVIDER`, `RESEND_API_KEY` environment variables |
| `INFRASTRUCTURE.md` | Must document new email environment variables for the worker and API services |
| `AFFILIATES.md` | Reference-only — documents affiliate env vars used in email referral links |
| `packages/worker/package.json` | May need `resend` SDK dependency if email sending is done from worker |
| `packages/api/package.json` | May need `resend` SDK dependency if email sending is done from API |
| `pnpm-workspace.yaml` | May need update if a new `packages/email` shared package is created |

## Dependency Map

- `packages/api/src/routes/auth.ts` → imports `packages/api/src/lib/email.ts` (for `sendVerificationEmail`, `sendPasswordResetEmail`)
- `packages/api/src/routes/auth.ts` → imports `packages/api/src/lib/jwt.ts` (for token signing/verification)
- `packages/api/src/routes/auth.ts` → imports `packages/api/src/lib/validation.ts` (for auth input schemas)
- `packages/api/src/routes/auth.ts` → imports `@taad/db` (for user queries)
- `packages/api/src/index.ts` → imports `packages/api/src/routes/auth.ts` (mounts auth routes)
- `packages/worker/src/index.ts` → imports `packages/worker/src/queues.ts` (all queue definitions)
- `packages/worker/src/index.ts` → imports `@taad/db` (for `games`, `stores`, `storeListings`, `priceHistory`, `storeListingStats` tables)
- `packages/worker/src/index.ts` → imports `@taad/scraper` (for `BaseScraper`, `ScrapedGame`)
- `packages/worker/src/queues.ts` → uses `bullmq` (Queue, QueueEvents)
- `packages/db/src/index.ts` → re-exports `packages/db/src/schema.ts` (all tables including `alertNotifications`, `priceAlerts`, `users`)
- `packages/scraper/src/referral.ts` → standalone utility (no local deps), will be imported by email template logic
- `packages/api/src/lib/email.ts` → currently standalone stub; will need `resend` SDK and possibly `@taad/db` for logging

## Test Files

- `packages/api/tests/lib/email.test.ts` — covers current stub `sendVerificationEmail`/`sendPasswordResetEmail` (will need significant rewrite when stub is replaced with real Resend implementation)
- `packages/api/tests/routes/auth.test.ts` — covers auth routes including registration and forgot-password flows that call email functions (may need mock updates)
- `packages/worker/tests/queues.test.ts` — covers queue instantiation (needs update to verify new `notificationQueue`/`emailQueue`)
- `packages/worker/tests/index.test.ts` — covers worker index including ingest and scrape logic (needs update for new email worker)
- `packages/db/tests/schema.test.ts` — covers schema table structure (needs update if `alertNotifications` columns are added)
- `packages/scraper/tests/referral.test.ts` — covers `buildReferralUrl()` (no changes needed, but validates affiliate link generation used by email templates)
- **Gap**: No existing tests for the unsubscribe endpoint (new route)
- **Gap**: No existing tests for email template rendering
- **Gap**: No existing tests for notification queue → email dispatch pipeline

## Estimated Change Surface

~10-12 files require changes across 4 packages. The most complex change is in `packages/worker/src/index.ts` (new email worker that consumes notification jobs, queries price alerts + users, and dispatches emails). `packages/api/src/lib/email.ts` requires a full rewrite from stub to real Resend integration with three methods. `packages/db/src/schema.ts` is a moderate-risk change since the `alertNotifications` table needs new columns, and tests that assert column lists must be updated. `packages/worker/src/queues.ts` is a small additive change (new queue definition). The new unsubscribe endpoint in the API is self-contained but touches JWT/HMAC signing which is a security-sensitive area. `packages/scraper/src/referral.ts` is read-only (consumed by email templates). If a new `packages/email` shared package is created, it adds workspace configuration overhead but cleanly separates concerns.

```cadre-json
{
  "relevantFiles": [
    { "path": "packages/api/src/lib/email.ts", "reason": "Current stub email service — must be replaced with real Resend-based EmailService with sendPriceAlert, sendVerificationEmail, sendPasswordResetEmail" },
    { "path": "packages/worker/src/queues.ts", "reason": "Defines BullMQ queues — needs a new notificationQueue/emailQueue for email send jobs" },
    { "path": "packages/worker/src/index.ts", "reason": "Ingest worker emits price-drop/all-time-low events — must wire to email jobs; needs new email worker consumer" },
    { "path": "packages/db/src/schema.ts", "reason": "alertNotifications table needs additional columns (emailStatus, emailMessageId, emailProvider) for send logging" },
    { "path": "packages/api/src/routes/auth.ts", "reason": "Already calls sendVerificationEmail/sendPasswordResetEmail — imports will change with real implementation" },
    { "path": "packages/api/src/index.ts", "reason": "API entry point — needs new unsubscribe route mounted" },
    { "path": "packages/scraper/src/referral.ts", "reason": "buildReferralUrl() utility for affiliate links — consumed by email templates for per-store buy links" },
    { "path": "packages/api/src/lib/jwt.ts", "reason": "JWT signing utilities — may be extended for signed unsubscribe tokens" },
    { "path": "packages/api/src/lib/validation.ts", "reason": "Zod validation schemas — needs new schema for unsubscribe endpoint" },
    { "path": "packages/db/src/index.ts", "reason": "DB client and re-exports — new schema columns flow through automatically" },
    { "path": ".env.example", "reason": "Must add EMAIL_FROM, EMAIL_PROVIDER, RESEND_API_KEY environment variables" },
    { "path": "INFRASTRUCTURE.md", "reason": "Must document new email environment variables for worker and API services" },
    { "path": "AFFILIATES.md", "reason": "Reference — documents affiliate env vars used in email referral links" },
    { "path": "packages/worker/package.json", "reason": "May need resend SDK dependency if email sending is done from worker" },
    { "path": "packages/api/package.json", "reason": "May need resend SDK dependency if email sending is done from API" },
    { "path": "pnpm-workspace.yaml", "reason": "May need update if a new packages/email shared package is created" }
  ],
  "dependencyMap": {
    "packages/api/src/lib/email.ts": [],
    "packages/worker/src/queues.ts": [],
    "packages/worker/src/index.ts": ["packages/worker/src/queues.ts", "packages/db/src/schema.ts", "packages/db/src/index.ts"],
    "packages/db/src/schema.ts": [],
    "packages/api/src/routes/auth.ts": ["packages/api/src/lib/email.ts", "packages/api/src/lib/jwt.ts", "packages/api/src/lib/validation.ts", "packages/db/src/index.ts"],
    "packages/api/src/index.ts": ["packages/api/src/routes/auth.ts"],
    "packages/scraper/src/referral.ts": [],
    "packages/api/src/lib/jwt.ts": [],
    "packages/api/src/lib/validation.ts": [],
    "packages/db/src/index.ts": ["packages/db/src/schema.ts"],
    ".env.example": [],
    "INFRASTRUCTURE.md": [],
    "AFFILIATES.md": [],
    "packages/worker/package.json": [],
    "packages/api/package.json": [],
    "pnpm-workspace.yaml": []
  },
  "testFiles": [
    "packages/api/tests/lib/email.test.ts",
    "packages/api/tests/routes/auth.test.ts",
    "packages/worker/tests/queues.test.ts",
    "packages/worker/tests/index.test.ts",
    "packages/db/tests/schema.test.ts",
    "packages/scraper/tests/referral.test.ts"
  ],
  "estimatedChanges": [
    { "path": "packages/api/src/lib/email.ts", "linesEstimate": 120 },
    { "path": "packages/worker/src/queues.ts", "linesEstimate": 10 },
    { "path": "packages/worker/src/index.ts", "linesEstimate": 80 },
    { "path": "packages/db/src/schema.ts", "linesEstimate": 15 },
    { "path": "packages/api/src/routes/auth.ts", "linesEstimate": 5 },
    { "path": "packages/api/src/index.ts", "linesEstimate": 10 },
    { "path": "packages/api/src/lib/jwt.ts", "linesEstimate": 15 },
    { "path": "packages/api/src/lib/validation.ts", "linesEstimate": 10 },
    { "path": ".env.example", "linesEstimate": 5 },
    { "path": "INFRASTRUCTURE.md", "linesEstimate": 15 },
    { "path": "packages/worker/package.json", "linesEstimate": 3 },
    { "path": "packages/api/package.json", "linesEstimate": 3 }
  ]
}
```
