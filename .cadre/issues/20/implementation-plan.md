# Implementation Plan — Issue #20: Email Notification System

## Overview

This plan integrates a transactional email provider (Resend) into the TheresAlwaysADeal monorepo. The work is split into three sessions:

1. **Session 1** — Schema extension, shared email package creation, and environment configuration (foundational)
2. **Session 2** — API integration: replace email stub, add unsubscribe endpoint (depends on session 1)
3. **Session 3** — Worker integration: notification queue, price-alert email dispatch (depends on session 1)

Sessions 2 and 3 are independent of each other and can run in parallel after session 1 completes.

---

## Key Design Decisions

- **Shared `packages/email` package**: Both `@taad/api` (auth emails) and `@taad/worker` (price alert emails) need to send emails via Resend. A shared `@taad/email` workspace package avoids SDK duplication. The pnpm workspace glob (`packages/*`) already covers this.
- **Intermediate `emailQueue`**: The requirements mandate a notification queue. The worker will consume price-drop/all-time-low events, look up matching `priceAlerts`, and enqueue per-user email jobs on `emailQueue`. A separate email worker processes the queue.
- **Schema extension**: `alertNotifications` gains `emailStatus`, `emailMessageId`, and `emailProvider` columns for send logging.
- **Unsubscribe tokens**: HMAC-based signed URL tokens (no login required, no expiry — permanent unsubscribe).
- **Email templates**: Simple HTML template functions (no React Email dependency) for compatibility with all major email clients.

---

```cadre-json
[
  {
    "id": "session-001",
    "name": "Schema extension, email package, and config",
    "rationale": "All foundational pieces — the schema columns, shared email package, and env config — must exist before the API and worker can integrate. The email package's send-logging method depends on the extended schema, so they belong in the same session.",
    "dependencies": [],
    "steps": [
      {
        "id": "session-001-step-001",
        "name": "Extend alertNotifications schema with email tracking columns",
        "description": "Add emailStatus (varchar, e.g. 'sent'/'failed'/'pending'), emailMessageId (text, provider message ID), and emailProvider (varchar, e.g. 'resend') columns to the alertNotifications table in packages/db/src/schema.ts. Update the schema test to assert the new columns exist.",
        "files": ["packages/db/src/schema.ts", "packages/db/tests/schema.test.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`alertNotifications` table includes `emailStatus` varchar column",
          "`alertNotifications` table includes `emailMessageId` text column",
          "`alertNotifications` table includes `emailProvider` varchar column",
          "Schema test asserts the three new columns are present on `alertNotifications`"
        ]
      },
      {
        "id": "session-001-step-002",
        "name": "Create packages/email workspace package with Resend SDK",
        "description": "Create a new packages/email package with package.json (depends on resend SDK and @taad/db), tsconfig.json, and src/index.ts exporting an EmailService with sendVerificationEmail(email, token), sendPasswordResetEmail(email, token), and sendPriceAlert(userId, alertId, priceData) methods. Each method uses the Resend SDK to send email and logs the result to the alertNotifications table (for sendPriceAlert) or console (for auth emails). Reads EMAIL_FROM, RESEND_API_KEY from env.",
        "files": [
          "packages/email/package.json",
          "packages/email/tsconfig.json",
          "packages/email/src/index.ts"
        ],
        "complexity": "complex",
        "acceptanceCriteria": [
          "`packages/email/package.json` declares `@taad/email` with `resend` and `@taad/db` as dependencies",
          "`packages/email/src/index.ts` exports `sendVerificationEmail(email, token)` that sends via Resend SDK",
          "`packages/email/src/index.ts` exports `sendPasswordResetEmail(email, token)` that sends via Resend SDK",
          "`packages/email/src/index.ts` exports `sendPriceAlert(userId, alertId, priceData)` that sends via Resend SDK and logs to `alertNotifications`",
          "All methods read `RESEND_API_KEY` and `EMAIL_FROM` from environment variables",
          "All methods handle Resend SDK errors gracefully without crashing"
        ]
      },
      {
        "id": "session-001-step-003",
        "name": "Create HTML email templates",
        "description": "Add email template functions in packages/email/src/templates.ts for: price alert (game image, title, alert condition, price breakdown with per-store referral buy links, unsubscribe link), email verification (verification URL), and password reset (reset URL). Templates use inline CSS for email client compatibility.",
        "files": ["packages/email/src/templates.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`priceAlertTemplate` function accepts game title, image URL, price data array (store name, price, referral URL), and unsubscribe URL, and returns an HTML string",
          "`verificationTemplate` function accepts a verification URL and returns an HTML string",
          "`passwordResetTemplate` function accepts a reset URL and returns an HTML string",
          "Templates use inline CSS styles (no external stylesheets) for email client compatibility",
          "Price alert template includes referral buy links for each store listing"
        ]
      },
      {
        "id": "session-001-step-004",
        "name": "Add email environment variables and documentation",
        "description": "Add EMAIL_FROM, EMAIL_PROVIDER, and RESEND_API_KEY to .env.example. Update the Worker and API environment variable tables in INFRASTRUCTURE.md to document the new email-related variables.",
        "files": [".env.example", "INFRASTRUCTURE.md"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`.env.example` includes `EMAIL_FROM`, `EMAIL_PROVIDER`, and `RESEND_API_KEY` entries with placeholder values",
          "`INFRASTRUCTURE.md` Worker env table includes `EMAIL_FROM`, `EMAIL_PROVIDER`, `RESEND_API_KEY`",
          "`INFRASTRUCTURE.md` API env table includes `EMAIL_FROM`, `EMAIL_PROVIDER`, `RESEND_API_KEY`"
        ]
      }
    ]
  },
  {
    "id": "session-002",
    "name": "API email integration and unsubscribe endpoint",
    "rationale": "Replacing the email stub in auth routes and adding the unsubscribe endpoint are both API-layer changes that share context (JWT/token utilities, route mounting, Hono patterns). The agent benefits from seeing the import replacement before building the new unsubscribe route.",
    "dependencies": ["session-001"],
    "steps": [
      {
        "id": "session-002-step-001",
        "name": "Replace email stub with @taad/email in API",
        "description": "Add @taad/email as a workspace dependency in packages/api/package.json. Update the import in packages/api/src/routes/auth.ts to use sendVerificationEmail and sendPasswordResetEmail from @taad/email instead of the local stub. Remove or deprecate the old packages/api/src/lib/email.ts stub file. Update packages/api/tests/lib/email.test.ts to test the new @taad/email integration (mock the Resend SDK).",
        "files": [
          "packages/api/package.json",
          "packages/api/src/routes/auth.ts",
          "packages/api/src/lib/email.ts",
          "packages/api/tests/lib/email.test.ts"
        ],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`packages/api/package.json` lists `@taad/email: workspace:*` as a dependency",
          "`packages/api/src/routes/auth.ts` imports `sendVerificationEmail` and `sendPasswordResetEmail` from `@taad/email`",
          "Old stub file `packages/api/src/lib/email.ts` is removed or replaced with a re-export from @taad/email",
          "Existing auth route tests continue to pass (email calls are mocked)"
        ]
      },
      {
        "id": "session-002-step-002",
        "name": "Add unsubscribe token utility and validation schema",
        "description": "Add signUnsubscribeToken(alertId) and verifyUnsubscribeToken(token) functions to packages/api/src/lib/jwt.ts using HMAC-SHA256 with the existing JWT_SECRET. The token encodes the alertId and has no expiry (permanent unsubscribe). Add an unsubscribeSchema Zod validator in packages/api/src/lib/validation.ts for the token query parameter.",
        "files": [
          "packages/api/src/lib/jwt.ts",
          "packages/api/src/lib/validation.ts"
        ],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`signUnsubscribeToken(alertId)` is exported from jwt.ts and returns a URL-safe token encoding the alertId",
          "`verifyUnsubscribeToken(token)` is exported from jwt.ts and returns the decoded alertId or throws on invalid token",
          "`unsubscribeSchema` is exported from validation.ts and validates a required `token` query string parameter",
          "Token verification rejects tampered tokens"
        ]
      },
      {
        "id": "session-002-step-003",
        "name": "Create unsubscribe route and mount in API",
        "description": "Create packages/api/src/routes/alerts.ts with a GET /unsubscribe endpoint that reads the signed token from query params, verifies it via verifyUnsubscribeToken, and sets isActive=false on the matching priceAlert. No authentication required. Mount the alerts route at /api/v1/alerts in packages/api/src/index.ts.",
        "files": [
          "packages/api/src/routes/alerts.ts",
          "packages/api/src/index.ts"
        ],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "GET `/api/v1/alerts/unsubscribe?token=<token>` deactivates the price alert matching the alertId in the token",
          "Endpoint returns 200 with a success message on valid token",
          "Endpoint returns 400 on missing or invalid token",
          "Endpoint does not require authentication (no auth middleware)",
          "Route is mounted in packages/api/src/index.ts under `/api/v1/alerts`"
        ]
      }
    ]
  },
  {
    "id": "session-003",
    "name": "Worker notification queue and email dispatch",
    "rationale": "The notification queue, alert-matching logic, and email worker are all worker-layer changes with a tight dependency chain — the queue must be defined before the notification processor and email worker can use it. Grouping them lets the agent see the queue shape when writing the consumers.",
    "dependencies": ["session-001"],
    "steps": [
      {
        "id": "session-003-step-001",
        "name": "Add emailQueue to worker queues",
        "description": "Add a new emailQueue BullMQ Queue (name: 'email') and emailQueueEvents QueueEvents to packages/worker/src/queues.ts. Export both. Update the queues test to verify the new queue is created and exported.",
        "files": [
          "packages/worker/src/queues.ts",
          "packages/worker/tests/queues.test.ts"
        ],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`emailQueue` is exported from queues.ts as a BullMQ Queue with name 'email'",
          "`emailQueueEvents` is exported from queues.ts as a QueueEvents for 'email'",
          "Queues test verifies `emailQueue` and `emailQueueEvents` are defined and correctly named"
        ]
      },
      {
        "id": "session-003-step-002",
        "name": "Add notification processor for price-drop and all-time-low events",
        "description": "Add BullMQ Workers in packages/worker/src/index.ts that consume from 'price-drop' and 'all-time-low' queues. For each event, query priceAlerts (active alerts for the gameId where targetPrice >= newPrice), join with users to get email, and enqueue a job on emailQueue per matching alert with userId, alertId, user email, game info, and store listing price data.",
        "files": [
          "packages/worker/src/index.ts"
        ],
        "complexity": "complex",
        "acceptanceCriteria": [
          "A new BullMQ Worker consumes from the 'price-drop' queue",
          "A new BullMQ Worker consumes from the 'all-time-low' queue",
          "Workers query active priceAlerts matching the gameId where targetPrice >= triggeredPrice",
          "Workers join with users table to retrieve the user email",
          "Workers enqueue one email job per matching alert on the emailQueue with userId, alertId, email, game title, and price data",
          "Workers handle the case where no matching alerts exist (no-op)"
        ]
      },
      {
        "id": "session-003-step-003",
        "name": "Add email worker consumer",
        "description": "Add a BullMQ Worker in packages/worker/src/index.ts that consumes from the 'email' queue. Each job calls sendPriceAlert from @taad/email with the job data (userId, alertId, priceData including store listings with referral URLs built via buildReferralUrl from @taad/scraper). Add @taad/email dependency to packages/worker/package.json.",
        "files": [
          "packages/worker/src/index.ts",
          "packages/worker/package.json"
        ],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "A new BullMQ Worker consumes from the 'email' queue",
          "`packages/worker/package.json` lists `@taad/email: workspace:*` as a dependency",
          "Worker calls `sendPriceAlert` from `@taad/email` for each job",
          "Worker builds referral URLs using `buildReferralUrl` from `@taad/scraper` for each store listing",
          "Worker handles email send failures gracefully (logs error, does not crash)"
        ]
      },
      {
        "id": "session-003-step-004",
        "name": "Update worker graceful shutdown",
        "description": "Update the SIGTERM handler in packages/worker/src/index.ts to close the new price-drop worker, all-time-low worker, and email worker alongside the existing scrape/ingest/featured-scrape workers.",
        "files": [
          "packages/worker/src/index.ts"
        ],
        "complexity": "simple",
        "acceptanceCriteria": [
          "SIGTERM handler closes the price-drop notification worker",
          "SIGTERM handler closes the all-time-low notification worker",
          "SIGTERM handler closes the email worker",
          "Existing scrapeWorker, ingestWorker, and featuredScrapeWorker shutdown calls remain unchanged"
        ]
      }
    ]
  }
]
```
