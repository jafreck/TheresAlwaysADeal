## Requirements

1. Expand the `price_alerts` DB schema to include `store_id` (nullable, for store-scoped alerts), `target_price_cents` (integer), `target_discount_percent` (integer/decimal), `notify_email` (boolean), `notify_slack_webhook` (encrypted text), and `is_active` (boolean, already exists)
2. Implement `GET /api/user/me/alerts` — list all price alerts for the authenticated user (JWT required)
3. Implement `POST /api/user/me/alerts` — create a price alert; validate that `gameId` exists in the DB before inserting
4. Implement `PATCH /api/user/me/alerts/:alertId` — update an existing alert (ownership check required)
5. Implement `DELETE /api/user/me/alerts/:alertId` — delete an alert (ownership check required)
6. Implement `PATCH /api/user/me/alerts/:alertId/pause` — toggle `is_active` to pause/resume an alert (ownership check required)
7. Enforce a per-user cap of 100 active alerts; reject creation when the limit is reached
8. Store `notify_slack_webhook` encrypted at rest (encrypt before DB write, decrypt on read)
9. Implement alert evaluation logic in the worker: on each price update (ingest), query active `price_alerts` for the affected game and evaluate trigger conditions (`current_price_cents <= target_price_cents`, `discount_percent >= target_discount_percent`, all-time-low event)
10. When an alert triggers, enqueue a notification job and insert a row into `alert_notifications` to record the notification was sent
11. For price-drop alerts (not all-time-low), keep `is_active = true` so re-notification occurs on further drops
12. Add Zod validation schemas for alert creation and update request bodies
13. Add unit tests for the alert trigger condition evaluation logic

## Change Type
feature

## Scope Estimate
medium

## Affected Areas
- `packages/db/src/schema.ts` — expand `priceAlerts` table with new columns (`storeId`, `targetPriceCents`, `targetDiscountPercent`, `notifyEmail`, `notifySlackWebhook`); existing `alertNotifications` table is already present
- `packages/api/src/routes/` — new `alerts.ts` route file implementing all five CRUD+pause endpoints
- `packages/api/src/index.ts` — mount the new alerts route under `/api/user/me/alerts` with auth middleware
- `packages/api/src/middleware/auth.ts` — already exists; will be reused for JWT auth on alert endpoints
- `packages/api/src/lib/validation.ts` — add Zod schemas for alert creation/update payloads
- `packages/worker/src/index.ts` — add alert evaluation logic inside the ingest worker (after price change detection) and wire up `priceDropQueue`/`allTimeLowQueue` consumers to evaluate alerts
- `packages/worker/src/queues.ts` — may need a new `notificationQueue` for enqueuing notification jobs
- `packages/api/tests/routes/` — new test file for alert endpoints
- `packages/worker/tests/` — new test file for alert trigger evaluation logic

## Ambiguities
1. The issue model uses `targetPriceCents` (integer cents) but the existing `priceAlerts` schema and `priceHistory` table use decimal dollars (`decimal(10,2)`). A decision is needed on whether to store cents or convert; the existing codebase convention is decimal dollars.
2. The issue references `notifySlackWebhook` encryption at rest but does not specify the encryption algorithm or key management strategy (e.g., AES-256-GCM with a `ENCRYPTION_KEY` env var).
3. The issue mentions notification jobs referencing issues #20 and #21 which are not yet implemented. The alert evaluation can enqueue jobs to a `notification` queue, but the actual notification delivery (email, Slack) depends on those future issues.
4. The pause endpoint (`PATCH .../pause`) behavior is not fully specified — it is unclear whether the body should contain `{ "isActive": true/false }` or if it should simply toggle the current state.
5. The issue says "100 active alerts per user" but doesn't clarify whether paused (inactive) alerts count toward the cap.
6. The existing `priceAlerts` table has a `targetPrice` decimal column, but the issue model specifies separate `targetPriceCents` and `targetDiscountPercent` fields. A migration will be needed to add/rename columns.

```cadre-json
{
  "requirements": [
    "Expand the price_alerts DB schema to include store_id (nullable), target_price_cents, target_discount_percent, notify_email, notify_slack_webhook (encrypted), and is_active columns",
    "Implement GET /api/user/me/alerts to list all price alerts for the authenticated user",
    "Implement POST /api/user/me/alerts to create a price alert with gameId existence validation",
    "Implement PATCH /api/user/me/alerts/:alertId to update an alert with ownership check",
    "Implement DELETE /api/user/me/alerts/:alertId to delete an alert with ownership check",
    "Implement PATCH /api/user/me/alerts/:alertId/pause to toggle is_active with ownership check",
    "Enforce a per-user cap of 100 active alerts",
    "Store notify_slack_webhook encrypted at rest",
    "Implement alert evaluation in the worker on each price update: query active alerts for the game and evaluate trigger conditions",
    "Enqueue notification jobs and insert alert_notifications rows when alerts trigger",
    "Keep is_active true for price-drop alerts so further drops re-notify",
    "Add Zod validation schemas for alert creation and update payloads",
    "Add unit tests for alert trigger condition evaluation logic"
  ],
  "changeType": "feature",
  "scope": "medium",
  "affectedAreas": [
    "packages/db/src/schema.ts",
    "packages/api/src/routes/",
    "packages/api/src/index.ts",
    "packages/api/src/middleware/auth.ts",
    "packages/api/src/lib/validation.ts",
    "packages/worker/src/index.ts",
    "packages/worker/src/queues.ts",
    "packages/api/tests/routes/",
    "packages/worker/tests/"
  ],
  "ambiguities": [
    "The issue model uses targetPriceCents (integer cents) but the existing schema uses decimal dollars — a convention decision is needed",
    "Encryption algorithm and key management strategy for notify_slack_webhook is not specified",
    "Notification delivery depends on issues #20 and #21 which are not yet implemented",
    "Pause endpoint behavior is unclear — should it accept a body with isActive or simply toggle the current state",
    "Whether paused (inactive) alerts count toward the 100 per-user cap is unspecified",
    "Existing priceAlerts table has a targetPrice decimal column that needs migration to match the new model"
  ]
}
```
