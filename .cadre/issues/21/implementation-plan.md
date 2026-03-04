# Implementation Plan: Slack Price Alert Notifications (#21)

## Overview

This plan implements Slack webhook-based price alert notifications. It is divided into three sessions: (1) foundational schema and encryption changes, (2) Slack service and API test endpoint, and (3) worker-side Slack notification consumer with retry logic.

### Key Design Decisions

- **Encryption key** is stored in a `SLACK_ENCRYPTION_KEY` environment variable (AES-256-GCM).
- **Per-alert webhook takes precedence** over the global user-level webhook when both are configured.
- **`channel` column** on `alertNotifications` defaults to `'email'` so existing inserts remain valid.
- **Worker Slack dispatch** uses its own lightweight Slack HTTP posting function (worker cannot import from `@taad/api`).
- **`slackNotificationQueue`** is a new dedicated queue so Slack dispatch is decoupled from `priceDropQueue`/`allTimeLowQueue`.

---

## Session 1: Schema, Encryption, and Config

Adds the foundational database columns and encryption utility that all subsequent work depends on.

### Steps

1. **Add Slack webhook and channel columns to schema** — Add `notifySlackWebhook` (nullable text) to `users` and `priceAlerts` tables; add `channel` (nullable varchar, default `'email'`) to `alertNotifications`.
2. **Create AES-256-GCM encryption utility** — New `packages/api/src/lib/encryption.ts` with `encrypt(plaintext)` and `decrypt(ciphertext)` functions using `SLACK_ENCRYPTION_KEY` env var.
3. **Update .env.example** — Add `SLACK_ENCRYPTION_KEY` entry.

---

## Session 2: Slack Service and API Route

Creates the Slack notification service, adds validation, the test-slack endpoint, and mounts the new route.

### Steps

1. **Add webhook URL validation schema** — Add a `testSlackSchema` Zod object to `validation.ts` with a `webhookUrl` field validating Slack webhook URL format.
2. **Create SlackNotificationService** — New `packages/api/src/lib/slack.ts` with `sendPriceAlert(webhookUrl, alertData)` that POSTs Slack Block Kit JSON (game image, price, discount, buy link, "see all prices" link) and classifies 4xx vs 5xx errors.
3. **Create user-alerts route** — New `packages/api/src/routes/user-alerts.ts` with `POST /test-slack` endpoint protected by auth middleware. Reads the user's webhook URL (decrypts), sends a sample Slack message, and logs to `alertNotifications` with `channel = 'slack'`.
4. **Mount user-alerts routes in API index** — Import and mount at `/user/me/alerts` in `packages/api/src/index.ts`.

---

## Session 3: Worker Slack Notification Consumer

Adds the worker-side queue and consumer that dispatches Slack notifications on price-drop and all-time-low events.

### Steps

1. **Add slackNotificationQueue** — New queue definition in `packages/worker/src/queues.ts`.
2. **Add Slack notification worker** — New worker in `packages/worker/src/index.ts` that consumes from `slackNotificationQueue`, looks up user webhook URLs, posts Block Kit payloads, handles 4xx (disable webhook + email stub notification) and 5xx/network errors (up to 3 retries with exponential backoff), and logs to `alertNotifications` with `channel = 'slack'`. Also enqueue Slack jobs from the ingest worker when price-drop or all-time-low events fire.

---

```cadre-json
[
  {
    "id": "session-001",
    "name": "Schema, encryption, and config",
    "rationale": "These foundational changes (DB columns, encryption utility, env config) are prerequisites for all Slack notification functionality in sessions 2 and 3.",
    "dependencies": [],
    "steps": [
      {
        "id": "session-001-step-001",
        "name": "Add Slack webhook and channel columns to schema",
        "description": "Add a nullable `notifySlackWebhook` text column to the `users` and `priceAlerts` tables, and add a nullable `channel` varchar column (default 'email') to the `alertNotifications` table in packages/db/src/schema.ts.",
        "files": ["packages/db/src/schema.ts", "packages/db/tests/schema.test.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`users` table has a `notifySlackWebhook` column of type text, nullable",
          "`priceAlerts` table has a `notifySlackWebhook` column of type text, nullable",
          "`alertNotifications` table has a `channel` column of type varchar with default value 'email'",
          "Schema tests assert the presence of `notifySlackWebhook` on `users` and `priceAlerts`, and `channel` on `alertNotifications`"
        ]
      },
      {
        "id": "session-001-step-002",
        "name": "Create AES-256-GCM encryption utility",
        "description": "Create packages/api/src/lib/encryption.ts exporting `encrypt(plaintext: string): string` and `decrypt(ciphertext: string): string` functions using AES-256-GCM with the `SLACK_ENCRYPTION_KEY` environment variable. The ciphertext format should encode the IV and auth tag alongside the encrypted data.",
        "files": ["packages/api/src/lib/encryption.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`encrypt` returns a string that can be round-tripped through `decrypt` to recover the original plaintext",
          "`encrypt` produces different ciphertext for each call (random IV)",
          "`decrypt` throws on tampered ciphertext (GCM authentication)",
          "Functions read the encryption key from `process.env.SLACK_ENCRYPTION_KEY`",
          "Key must be exactly 32 bytes (256 bits) when decoded"
        ]
      },
      {
        "id": "session-001-step-003",
        "name": "Add SLACK_ENCRYPTION_KEY to .env.example",
        "description": "Add a `SLACK_ENCRYPTION_KEY` entry to .env.example under a new Slack section with a placeholder value and comment explaining it must be a 32-byte hex-encoded key.",
        "files": [".env.example"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`.env.example` contains a `SLACK_ENCRYPTION_KEY` entry",
          "A comment explains the key must be 32 bytes (64 hex characters)"
        ]
      }
    ]
  },
  {
    "id": "session-002",
    "name": "Slack service and API test endpoint",
    "rationale": "The Slack service, validation schema, route, and API mounting form a tight dependency chain — the validation is consumed by the route, the route calls the Slack service, and the route must be mounted in the API index.",
    "dependencies": ["session-001"],
    "steps": [
      {
        "id": "session-002-step-001",
        "name": "Add webhook URL validation schema",
        "description": "Add a `testSlackSchema` Zod object to packages/api/src/lib/validation.ts that validates a `webhookUrl` string field matching the Slack webhook URL pattern (https://hooks.slack.com/services/...).",
        "files": ["packages/api/src/lib/validation.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`testSlackSchema` is exported from validation.ts",
          "Schema accepts valid Slack webhook URLs (https://hooks.slack.com/services/T.../B.../...)",
          "Schema rejects non-Slack URLs and empty strings"
        ]
      },
      {
        "id": "session-002-step-002",
        "name": "Create SlackNotificationService",
        "description": "Create packages/api/src/lib/slack.ts exporting a `sendPriceAlert(webhookUrl: string, alertData: PriceAlertData): Promise<SlackResult>` function that POSTs a Slack Block Kit payload (game image, current price, original price, discount percentage, buy link, 'see all prices' link) and returns a result indicating success, invalid_webhook (4xx), or transient_error (5xx/network).",
        "files": ["packages/api/src/lib/slack.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`sendPriceAlert` is exported from slack.ts",
          "Function POSTs JSON to the provided webhook URL",
          "Payload uses Slack Block Kit format with section blocks for game image, price details, discount, and action buttons",
          "Returns `{ ok: true }` on 2xx responses",
          "Returns `{ ok: false, reason: 'invalid_webhook' }` on 4xx responses",
          "Returns `{ ok: false, reason: 'transient_error' }` on 5xx or network errors"
        ]
      },
      {
        "id": "session-002-step-003",
        "name": "Create user-alerts route with test-slack endpoint",
        "description": "Create packages/api/src/routes/user-alerts.ts with a `POST /test-slack` endpoint protected by authMiddleware. The endpoint accepts a webhook URL in the request body (validated by testSlackSchema), encrypts and stores it on the user record, sends a sample Slack message via SlackNotificationService, and logs the attempt to alertNotifications with channel='slack'.",
        "files": ["packages/api/src/routes/user-alerts.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "Route exports a `createUserAlertsApp` factory function following the existing route pattern",
          "`POST /test-slack` requires a valid Bearer token (authMiddleware)",
          "Request body is validated against `testSlackSchema`",
          "Webhook URL is encrypted before storage using the encryption utility",
          "A sample Slack message is sent to the provided webhook URL",
          "On success, returns 200 with a success message",
          "On invalid webhook (4xx from Slack), returns 400 with an error message"
        ]
      },
      {
        "id": "session-002-step-004",
        "name": "Mount user-alerts routes in API index",
        "description": "Import `createUserAlertsApp` in packages/api/src/index.ts and mount it at `/user/me/alerts` on the v1 router.",
        "files": ["packages/api/src/index.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`createUserAlertsApp` is imported from `./routes/user-alerts.js`",
          "Route is mounted at `v1.route('/user/me/alerts', createUserAlertsApp(getRedis))`",
          "Existing routes continue to function unchanged"
        ]
      }
    ]
  },
  {
    "id": "session-003",
    "name": "Worker Slack notification consumer",
    "rationale": "The worker-side queue and consumer are independent from the API route but depend on the schema changes from session 1. They are grouped together because the queue definition and worker consumer form a producer-consumer pair.",
    "dependencies": ["session-001"],
    "steps": [
      {
        "id": "session-003-step-001",
        "name": "Add slackNotificationQueue",
        "description": "Add a `slackNotificationQueue` Queue instance and corresponding `slackNotificationQueueEvents` QueueEvents instance to packages/worker/src/queues.ts.",
        "files": ["packages/worker/src/queues.ts", "packages/worker/tests/queues.test.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`slackNotificationQueue` is exported with queue name 'slack-notification'",
          "`slackNotificationQueueEvents` is exported for the same queue name",
          "Existing queue exports are unchanged",
          "Queue tests assert the new queue and queue events are created"
        ]
      },
      {
        "id": "session-003-step-002",
        "name": "Add Slack notification worker with retry and error handling",
        "description": "Add a Slack notification worker in packages/worker/src/index.ts that consumes from `slackNotificationQueue`. The worker looks up the user's encrypted webhook URL (per-alert first, then global), decrypts it, POSTs a Block Kit payload to Slack, and logs to `alertNotifications` with channel='slack'. On 4xx errors, the webhook is disabled (set to null) and a stub email notification is sent. On 5xx/network errors, the job is retried up to 3 times with exponential backoff. Also update the ingest worker to enqueue Slack notification jobs when price-drop or all-time-low events are emitted.",
        "files": ["packages/worker/src/index.ts"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "A new BullMQ Worker consumes from the 'slack-notification' queue",
          "Worker resolves webhook URL with per-alert priority over global user webhook",
          "Worker decrypts the webhook URL using AES-256-GCM (same encryption utility pattern as API)",
          "Worker POSTs Slack Block Kit JSON with game image, price, discount, buy link",
          "On 4xx from Slack, the webhook column is set to null and the email stub is called",
          "On 5xx or network error, the job retries up to 3 times with exponential backoff (BullMQ backoff config)",
          "Each notification attempt is logged to `alertNotifications` with `channel = 'slack'`",
          "The ingest worker enqueues a job to `slackNotificationQueue` when a price-drop or all-time-low event is detected for a user with a configured Slack webhook",
          "The new worker is closed in the graceful shutdown handler"
        ]
      }
    ]
  }
]
```
