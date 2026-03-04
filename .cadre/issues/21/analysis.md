# Analysis: [FEATURE-21] Slack Price Alert Notifications

## Requirements

1. Add a `notify_slack_webhook` field to the `price_alerts` table for per-alert Slack webhook configuration
2. Add a `notify_slack_webhook` field to the `users` table for global/profile-level Slack webhook configuration
3. Implement a `SlackNotificationService.sendPriceAlert(webhookUrl, alertData)` that POSTs Slack Block Kit JSON payloads to the webhook URL
4. Handle 4xx errors from Slack (invalid webhook) by disabling the webhook and notifying the user via email
5. Handle 5xx / network errors from Slack with retry logic (up to 3 retries with exponential backoff)
6. Consume price-drop/alert events from the existing notification job queue (shared with email service from #20)
7. Add a test notification endpoint `POST /api/user/me/alerts/test-slack` that sends a sample message to the configured webhook
8. Store Slack webhook URLs encrypted at rest using AES-256
9. Log all Slack notification attempts in the `alert_notifications` table with `channel = 'slack'`
10. Format Slack messages using Block Kit with game image, price details, discount percentage, buy link, and "see all prices" link

## Change Type
feature

## Scope Estimate
medium

## Scout Policy
required

## Affected Areas
- `packages/db/src/schema.ts` — Add `notify_slack_webhook` column to `users` and `price_alerts` tables; add `channel` column to `alert_notifications` table
- `packages/api/src/lib/` — New Slack notification service (`slack.ts`) and encryption utility for webhook URL storage
- `packages/api/src/routes/` — New route file for user alert endpoints (test-slack endpoint)
- `packages/worker/src/queues.ts` — Possibly a new notification queue or consumption of the existing `priceDropQueue`/`allTimeLowQueue` for Slack dispatch
- `packages/worker/src/` — New worker/consumer for Slack notification jobs with retry logic
- `packages/api/tests/` — Tests for Slack service, encryption, and test-slack endpoint
- `packages/worker/tests/` — Tests for Slack notification worker/consumer
- `packages/db/tests/` — Schema tests for new columns

## Ambiguities
1. The issue references consuming from "the same notification job queue as the email service (#20)" but #20 does not appear to be implemented yet — the worker currently has `priceDropQueue` and `allTimeLowQueue` but no dedicated notification queue. The notification queue design may need to be created as part of this issue or deferred to #20.
2. The issue lists dependencies on #19 (Price Watchlist & Alert Rules API) and #16 (User Profile Management API), neither of which appear to be implemented — there are no user profile or alert management routes in the current codebase. This issue may need to be scoped to just the Slack notification service and test endpoint, deferring full integration.
3. The `alert_notifications` table currently lacks a `channel` column to distinguish between email and Slack notifications — the issue says to log with `channel = 'slack'` but the schema doesn't support this yet.
4. The AES-256 encryption requirement for webhook URLs does not specify key management — should an environment variable hold the encryption key, or should a secrets manager be used?
5. Per-alert vs. global webhook precedence is unspecified — if a user has both a global webhook and a per-alert webhook, which takes priority?
6. The "notify user via email" on invalid webhook requirement depends on a working email service, but the current email service is a stub (console.log only).

```cadre-json
{
  "requirements": [
    "Add a notify_slack_webhook field to the price_alerts table for per-alert Slack webhook configuration",
    "Add a notify_slack_webhook field to the users table for global/profile-level Slack webhook configuration",
    "Implement SlackNotificationService.sendPriceAlert(webhookUrl, alertData) that POSTs Slack Block Kit JSON payloads to the webhook URL",
    "Handle 4xx errors from Slack (invalid webhook) by disabling the webhook and notifying the user via email",
    "Handle 5xx / network errors from Slack with retry logic (up to 3 retries with exponential backoff)",
    "Consume price-drop/alert events from the existing notification job queue (shared with email service from #20)",
    "Add a test notification endpoint POST /api/user/me/alerts/test-slack that sends a sample message to the configured webhook",
    "Store Slack webhook URLs encrypted at rest using AES-256",
    "Log all Slack notification attempts in the alert_notifications table with channel = 'slack'",
    "Format Slack messages using Block Kit with game image, price details, discount percentage, buy link, and see all prices link"
  ],
  "changeType": "feature",
  "scope": "medium",
  "scoutPolicy": "required",
  "affectedAreas": [
    "packages/db/src/schema.ts",
    "packages/api/src/lib/",
    "packages/api/src/routes/",
    "packages/worker/src/queues.ts",
    "packages/worker/src/",
    "packages/api/tests/",
    "packages/worker/tests/",
    "packages/db/tests/"
  ],
  "ambiguities": [
    "The issue references consuming from the same notification job queue as the email service (#20) but no dedicated notification queue exists yet — the worker only has priceDropQueue and allTimeLowQueue. The notification queue design may need to be created as part of this issue or deferred.",
    "Dependencies on #19 (Price Watchlist & Alert Rules API) and #16 (User Profile Management API) are not yet implemented — no user profile or alert management routes exist in the codebase.",
    "The alert_notifications table lacks a channel column to distinguish between email and Slack notifications, which needs to be added.",
    "AES-256 encryption key management for webhook URLs is unspecified — environment variable vs. secrets manager.",
    "Per-alert vs. global webhook precedence is unspecified when a user has both configured.",
    "The notify user via email on invalid webhook requirement depends on a working email service, but the current email service is a console.log stub."
  ]
}
```
