## Requirements
1. Implement `GET /api/user/me` endpoint that returns the current authenticated user's profile (id, email, displayName, emailVerified, steamId, steamLinked, notificationPreferences, createdAt)
2. Implement `PATCH /api/user/me` endpoint to update display name and notification preferences (emailAlerts toggle, Slack webhook URL, default alert currency)
3. Implement `POST /api/user/me/change-password` endpoint that requires the current password before setting a new one
4. Implement `DELETE /api/user/me` endpoint that anonymizes user PII per GDPR (replace PII with hashed values, keep price history rows intact)
5. All four endpoints must require JWT authentication via the existing `authMiddleware`
6. Validate all input: display name length, email format for any email changes, password minimum length
7. On email change, send a verification email to the new address before updating the stored email
8. Add `displayName` column to the users table (or map existing `name` column) and add notification preference columns (`emailAlerts`, `slackAlertsEnabled`, `slackWebhookUrl`, `defaultAlertCurrency`)
9. Profile response must return `steamLinked: true` when the user has a linked Steam account (i.e., `steamId` is non-null)
10. Add unit and integration tests for all four endpoints

## Change Type
feature

## Scope Estimate
medium

## Affected Areas
- `packages/db/src/schema.ts` — add/rename notification preference columns and optional `displayName` column to the `users` table
- `packages/api/src/routes/` — new `user.ts` route file for the four profile endpoints
- `packages/api/src/lib/validation.ts` — new Zod schemas for profile update, change-password, and account deletion requests
- `packages/api/src/index.ts` — mount the new user routes under `/api/v1/user`
- `packages/api/src/middleware/auth.ts` — may need to verify the JWT payload shape exposes `sub` for user lookup
- `packages/api/src/lib/email.ts` — may need a new helper for email-change verification
- `packages/api/tests/routes/` — new test file(s) for user profile endpoints
- `packages/db/` — potential migration for new columns

## Ambiguities
- The existing `users` table has a `name` column; the issue specifies `displayName`. It is unclear whether `name` should be renamed to `displayName` or if a new column should be added alongside it.
- The issue mentions "On email change: send verification to new address before updating" but `PATCH /api/user/me` only lists display name and notification preferences as updatable fields — it's unclear if email changes are in scope for this issue or deferred.
- Notification preferences include "Store Slack webhook URL" and "Set default alert currency" but the profile JSON example only shows `emailAlerts` and `slackAlertsEnabled` — the full shape of notification preferences (webhook URL field, currency field) is not specified in the example payload.
- GDPR deletion says "replace PII with hashed values, keep price history rows" but does not specify whether wishlists and price alerts should also be deleted or anonymized.
- The issue references #17 (Steam linking) for `steamLinked` but #17 may not be implemented yet — unclear if this field should be stubbed or fully dependent on that work.
- The `DELETE` endpoint does not specify whether re-authentication (password confirmation) is required before account deletion.

```cadre-json
{
  "requirements": [
    "Implement GET /api/user/me endpoint returning the authenticated user's profile (id, email, displayName, emailVerified, steamId, steamLinked, notificationPreferences, createdAt)",
    "Implement PATCH /api/user/me endpoint to update display name and notification preferences (emailAlerts, slackAlertsEnabled, slackWebhookUrl, defaultAlertCurrency)",
    "Implement POST /api/user/me/change-password endpoint requiring current password verification before setting a new one",
    "Implement DELETE /api/user/me endpoint that anonymizes PII per GDPR (hash PII, retain price history rows)",
    "All endpoints must require JWT authentication via existing authMiddleware",
    "Validate all input: display name length, email format, password minimum length",
    "On email change, send verification email to the new address before updating the stored email",
    "Add notification preference columns (emailAlerts, slackAlertsEnabled, slackWebhookUrl, defaultAlertCurrency) and displayName column to the users table schema",
    "Profile response must compute and return steamLinked: true when steamId is non-null",
    "Add unit and integration tests for all four profile endpoints"
  ],
  "changeType": "feature",
  "scope": "medium",
  "affectedAreas": [
    "packages/db/src/schema.ts",
    "packages/api/src/routes/ (new user.ts)",
    "packages/api/src/lib/validation.ts",
    "packages/api/src/index.ts",
    "packages/api/src/middleware/auth.ts",
    "packages/api/src/lib/email.ts",
    "packages/api/tests/routes/ (new user profile tests)",
    "packages/db/ (migration for new columns)"
  ],
  "ambiguities": [
    "The existing users table has a 'name' column; the issue specifies 'displayName'. Unclear whether to rename or add a new column.",
    "The issue mentions email-change verification but PATCH /api/user/me only lists displayName and notification preferences as updatable — unclear if email changes are in scope.",
    "Notification preferences include Slack webhook URL and default alert currency but the example JSON only shows emailAlerts and slackAlertsEnabled — full payload shape is not specified.",
    "GDPR deletion says 'keep price history rows' but does not specify handling of wishlists and price alerts.",
    "Issue references #17 (Steam linking) for steamLinked — unclear if this should be stubbed or depends on that issue being completed first.",
    "DELETE endpoint does not specify whether re-authentication (password confirmation) is required before account deletion."
  ]
}
```
