# Implementation Plan — Issue #19: Price Alert CRUD & Evaluation

## Overview

This plan implements the price alert CRUD API endpoints, expands the DB schema, adds Zod validation, Slack webhook encryption, and worker-side alert evaluation logic. It is split into 3 sessions: foundational schema/validation/encryption, API endpoints, and worker evaluation.

### Ambiguity Resolutions

- **Cents vs decimal dollars:** The existing `priceAlerts.targetPrice` column uses `decimal(10,2)` (dollars), consistent with `priceHistory`. We keep `targetPrice` as-is (make it nullable for discount-only alerts) and do **not** introduce a `targetPriceCents` integer column. This avoids unit-conversion bugs across the codebase.
- **Encryption:** Use AES-256-GCM with an `ENCRYPTION_KEY` environment variable (hex-encoded 32-byte key). A new `packages/api/src/lib/encryption.ts` utility handles encrypt/decrypt.
- **Pause endpoint:** The `PATCH .../pause` endpoint accepts `{ "isActive": boolean }` in the request body (explicit over toggle) for predictability.
- **100-alert cap:** Only active (`is_active = true`) alerts count toward the per-user cap. Paused alerts do not count.
- **Notification delivery:** Alert evaluation enqueues jobs to a `notification` queue and inserts `alertNotifications` rows, but actual delivery (email/Slack) is deferred to issues #20/#21.

---

## Session 1 — Foundation: Schema, Validation, and Encryption

Adds the new DB columns, Zod schemas, encryption utility, and env config needed by both the API and worker packages.

## Session 2 — Alert CRUD API Endpoints

Creates the 5 alert endpoints (list, create, update, delete, pause), mounts them in the API router, and updates the OpenAPI spec.

## Session 3 — Worker Alert Evaluation

Adds a notification queue and alert evaluation workers that consume price-drop and all-time-low events, query matching active alerts, and enqueue notification jobs.

---

```cadre-json
[
  {
    "id": "session-001",
    "name": "Foundation: Schema, Validation, and Encryption",
    "rationale": "These foundational changes (DB columns, Zod schemas, encryption utility, env config) are tightly coupled and must all exist before the API routes or worker evaluation logic can be built.",
    "dependencies": [],
    "steps": [
      {
        "id": "session-001-step-001",
        "name": "Expand priceAlerts schema with new columns",
        "description": "Add storeId (nullable UUID FK to stores), targetDiscountPercent (decimal, nullable), notifyEmail (boolean, default true), and notifySlackWebhook (text, nullable) columns to the priceAlerts table. Make the existing targetPrice column nullable to support discount-only alerts.",
        "files": ["packages/db/src/schema.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "priceAlerts table has a nullable `storeId` column with a foreign key reference to `stores.id`",
          "priceAlerts table has a nullable `targetDiscountPercent` decimal(5,2) column",
          "priceAlerts table has a `notifyEmail` boolean column defaulting to true",
          "priceAlerts table has a nullable `notifySlackWebhook` text column",
          "The existing `targetPrice` column is now nullable (to allow discount-only alerts)",
          "All existing columns (id, userId, gameId, isActive, createdAt, updatedAt) are preserved unchanged"
        ]
      },
      {
        "id": "session-001-step-002",
        "name": "Add Zod validation schemas for alert payloads",
        "description": "Add createAlertSchema and updateAlertSchema Zod schemas in the validation module. The create schema requires gameId and at least one of targetPrice or targetDiscountPercent. The update schema makes all fields optional.",
        "files": ["packages/api/src/lib/validation.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`createAlertSchema` is exported and requires `gameId` (UUID string)",
          "`createAlertSchema` accepts optional `storeId` (UUID string), `targetPrice` (positive number), `targetDiscountPercent` (number 0-100), `notifyEmail` (boolean), `notifySlackWebhook` (string URL)",
          "`createAlertSchema` enforces that at least one of `targetPrice` or `targetDiscountPercent` is provided via a Zod refinement",
          "`updateAlertSchema` is exported and makes all fields optional (partial of create schema without gameId)",
          "Existing validation schemas are not modified"
        ]
      },
      {
        "id": "session-001-step-003",
        "name": "Create encryption utility for Slack webhook",
        "description": "Create a new encryption module that provides encrypt and decrypt functions using AES-256-GCM with the ENCRYPTION_KEY environment variable. This is used to store notifySlackWebhook encrypted at rest.",
        "files": ["packages/api/src/lib/encryption.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`encrypt(plaintext: string): string` function is exported and returns a colon-separated string of iv:authTag:ciphertext (all hex-encoded)",
          "`decrypt(encrypted: string): string` function is exported and reverses the encryption",
          "Both functions use AES-256-GCM with a 32-byte key derived from the `ENCRYPTION_KEY` env var",
          "The module throws a clear error if `ENCRYPTION_KEY` is not set when encrypt/decrypt is called"
        ]
      },
      {
        "id": "session-001-step-004",
        "name": "Add ENCRYPTION_KEY to .env.example",
        "description": "Add an ENCRYPTION_KEY environment variable entry to .env.example under a new 'Encryption' section so developers know to configure it.",
        "files": [".env.example"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`.env.example` contains an `ENCRYPTION_KEY` entry with a placeholder value and a descriptive comment"
        ]
      }
    ]
  },
  {
    "id": "session-002",
    "name": "Alert CRUD API Endpoints",
    "rationale": "The five alert endpoints all share the same auth middleware, DB queries, and validation schemas. They form a single cohesive route file that should be built and mounted together.",
    "dependencies": ["session-001"],
    "steps": [
      {
        "id": "session-002-step-001",
        "name": "Create alerts route with CRUD and pause endpoints",
        "description": "Create packages/api/src/routes/alerts.ts implementing GET / (list alerts), POST / (create alert with gameId validation and 100-alert cap), PATCH /:alertId (update alert with ownership check), DELETE /:alertId (delete alert with ownership check), and PATCH /:alertId/pause (set isActive with ownership check). Use authMiddleware for all endpoints. Encrypt/decrypt notifySlackWebhook on write/read.",
        "files": ["packages/api/src/routes/alerts.ts"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "GET / returns all alerts for the authenticated user with decrypted Slack webhooks",
          "POST / validates the request body with createAlertSchema, verifies gameId exists in the games table, enforces the 100 active alert cap, encrypts notifySlackWebhook before insert, and returns 201 with the created alert",
          "POST / returns 400 if gameId does not exist in the database",
          "POST / returns 409 or 400 if the user already has 100 active alerts",
          "PATCH /:alertId validates the body with updateAlertSchema, checks ownership (userId matches JWT sub), encrypts notifySlackWebhook if provided, and returns the updated alert",
          "PATCH /:alertId returns 404 if the alert does not exist or is not owned by the user",
          "DELETE /:alertId checks ownership and deletes the alert, returning 204",
          "DELETE /:alertId returns 404 if the alert does not exist or is not owned by the user",
          "PATCH /:alertId/pause accepts { isActive: boolean }, checks ownership, updates isActive, and returns the updated alert",
          "All endpoints use authMiddleware to require a valid JWT"
        ]
      },
      {
        "id": "session-002-step-002",
        "name": "Mount alerts route in API index",
        "description": "Import the alerts route in packages/api/src/index.ts and mount it on the v1 router under /user/me/alerts with the auth middleware applied.",
        "files": ["packages/api/src/index.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "The alerts route is imported from './routes/alerts.js'",
          "The alerts route is mounted at `/user/me/alerts` on the v1 router",
          "The authMiddleware is applied to the alerts route (either in the route file or at mount time)",
          "Existing route mounts are not modified"
        ]
      },
      {
        "id": "session-002-step-003",
        "name": "Update OpenAPI spec with alert endpoints",
        "description": "Add OpenAPI path definitions for all five alert endpoints (GET, POST, PATCH, DELETE, PATCH pause) to the spec object in packages/api/src/openapi.ts, including request/response schemas and auth requirements.",
        "files": ["packages/api/src/openapi.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "OpenAPI spec includes path definitions for GET /user/me/alerts, POST /user/me/alerts, PATCH /user/me/alerts/{alertId}, DELETE /user/me/alerts/{alertId}, and PATCH /user/me/alerts/{alertId}/pause",
          "All alert endpoints specify 401 Unauthorized response for missing/invalid auth",
          "POST endpoint schema documents the request body matching createAlertSchema",
          "PATCH update endpoint schema documents the optional fields matching updateAlertSchema",
          "Endpoints are tagged with 'Alerts'"
        ]
      }
    ]
  },
  {
    "id": "session-003",
    "name": "Worker Alert Evaluation Logic",
    "rationale": "The alert evaluation logic in the worker consumes price-drop and all-time-low queue events and is independent of the API CRUD routes. It only depends on the expanded DB schema from session 1.",
    "dependencies": ["session-001"],
    "steps": [
      {
        "id": "session-003-step-001",
        "name": "Add notification queue definition",
        "description": "Add a notificationQueue (and its QueueEvents) to packages/worker/src/queues.ts for enqueuing notification jobs when alerts trigger.",
        "files": ["packages/worker/src/queues.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`notificationQueue` is exported as a new BullMQ Queue named 'notification'",
          "`notificationQueueEvents` is exported as the corresponding QueueEvents",
          "Existing queue definitions are not modified"
        ]
      },
      {
        "id": "session-003-step-002",
        "name": "Add alert evaluation workers for price-drop and all-time-low events",
        "description": "Add two new BullMQ workers in packages/worker/src/index.ts: one consuming the price-drop queue and one consuming the all-time-low queue. Each worker queries active priceAlerts for the affected gameId (optionally filtered by storeId), evaluates trigger conditions (current_price <= targetPrice, discount_percent >= targetDiscountPercent, or all-time-low event), enqueues a notification job to notificationQueue, and inserts a row into alertNotifications. Price-drop alerts keep isActive=true for re-notification; all-time-low alerts also keep isActive=true. Add the new workers to graceful shutdown.",
        "files": ["packages/worker/src/index.ts"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "A new Worker consumes jobs from the 'price-drop' queue and evaluates active alerts for the given gameId",
          "A new Worker consumes jobs from the 'all-time-low' queue and evaluates active alerts for the given gameId",
          "For price-drop events: alerts trigger when current price <= targetPrice or discount >= targetDiscountPercent",
          "For all-time-low events: all active alerts for the game trigger unconditionally",
          "When an alert triggers, a job is added to `notificationQueue` with alert and price details",
          "When an alert triggers, a row is inserted into `alertNotifications` with alertId, storeListingId, and triggeredPrice",
          "Triggered price-drop alerts remain active (isActive is not set to false)",
          "Both new workers are included in the graceful shutdown handler",
          "The notificationQueue is imported from './queues.js'"
        ]
      }
    ]
  }
]
```
