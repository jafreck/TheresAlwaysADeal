## Requirements

1. Integrate a transactional email provider (Resend recommended) with API key configuration and DNS setup guidance (SPF, DKIM, DMARC)
2. Create an `EmailService` module with three methods: `sendPriceAlert(userId, alertId, priceData)`, `sendVerificationEmail(userId, token)`, and `sendPasswordResetEmail(userId, token)`
3. The `sendPriceAlert` method must consume jobs from an email/notification queue (connected to existing `priceDropQueue`/`allTimeLowQueue` events)
4. Design responsive HTML email templates (using React Email or MJML) for: price alert (game image, title, alert condition, price breakdown with store comparison, referral buy links), email verification, and password reset
5. Price alert emails must include referral/affiliate buy links for each store (using existing affiliate tag env vars from `AFFILIATES.md`)
6. Implement unsubscribe/one-click alert pause from email link using a signed token (no login required)
7. Add email send logging — store send result in the existing `alert_notifications` table (schema already exists in `packages/db/src/schema.ts`)
8. Price alert emails must be sent within 5 minutes of a trigger being detected
9. Emails must render correctly in major email clients (Gmail, Outlook, Apple Mail)
10. Add environment variables: `EMAIL_FROM`, `EMAIL_PROVIDER`, `RESEND_API_KEY`

## Change Type
feature

## Scope Estimate
large

## Scout Policy
required

## Affected Areas
- `packages/worker/` — new email worker that consumes notification jobs from the queue; wire `priceDropQueue`/`allTimeLowQueue` events to email dispatch
- `packages/worker/src/queues.ts` — add a new `notificationQueue` (or email queue) for email send jobs
- `packages/db/src/schema.ts` — the `alertNotifications` table already exists but may need additional columns (e.g., `emailStatus`, `emailProvider`, `emailMessageId`)
- `packages/api/src/` — new unsubscribe endpoint (token-verified, no auth required) to pause/deactivate a `priceAlert`
- `packages/api/src/routes/auth.ts` — integrate `sendVerificationEmail` and `sendPasswordResetEmail` calls into existing auth flows
- New package or shared module (e.g., `packages/email/`) — `EmailService` class, Resend SDK integration, HTML email templates (React Email)
- `.env.example` — add `EMAIL_FROM`, `EMAIL_PROVIDER`, `RESEND_API_KEY`
- `INFRASTRUCTURE.md` — document new email env vars for worker service
- `packages/web/` — potential "manage alerts" page link target (referenced in email)

## Ambiguities

1. Should the email service be a new workspace package (`packages/email`) or embedded directly in `packages/worker`? The issue says "create `EmailService`" but doesn't specify where it lives. A shared package makes sense since both `worker` (price alerts) and `api` (auth emails) need to send emails.
2. The issue references consuming from a "notification job queue" for `sendPriceAlert`, but the existing `priceDropQueue` and `allTimeLowQueue` emit raw price events — should there be a separate `notificationQueue` that aggregates these into user-facing email jobs, or should the existing queues be consumed directly?
3. The `alertNotifications` table in the DB schema currently only stores `alertId`, `storeListingId`, `triggeredPrice`, and `sentAt`. It lacks fields for email delivery status, message ID, or provider response. Should the schema be extended?
4. The unsubscribe link uses a "signed token" — should this be a JWT with embedded alert ID, or an HMAC-based URL token? What should the expiry be (or should it be permanent)?
5. Issue #15 (User Authentication) is listed as a dependency — are the `sendVerificationEmail` and `sendPasswordResetEmail` methods expected to be wired into the existing auth routes in this issue, or just created as standalone methods for #15 to integrate later?
6. The "link to manage all alerts" in the price alert email — does this link require the user to be logged in on the web app, or should it also use a signed token for passwordless access?
7. Should there be deduplication logic to avoid sending multiple emails for the same alert trigger (e.g., if multiple store listings for the same game drop below the target price simultaneously)?

```cadre-json
{
  "requirements": [
    "Integrate a transactional email provider (Resend recommended) with API key configuration and DNS setup guidance",
    "Create an EmailService module with sendPriceAlert(userId, alertId, priceData), sendVerificationEmail(userId, token), and sendPasswordResetEmail(userId, token) methods",
    "sendPriceAlert must consume jobs from a notification queue connected to existing priceDropQueue/allTimeLowQueue events",
    "Design responsive HTML email templates for price alert (game image, title, alert condition, price breakdown with store comparison, referral buy links), email verification, and password reset",
    "Price alert emails must include referral/affiliate buy links for each store using existing affiliate tag environment variables",
    "Implement unsubscribe/one-click alert pause from email link using a signed token without requiring login",
    "Add email send logging by storing send results in the existing alert_notifications table",
    "Price alert emails must be sent within 5 minutes of a trigger being detected",
    "Emails must render correctly in major email clients (Gmail, Outlook, Apple Mail)",
    "Add environment variables: EMAIL_FROM, EMAIL_PROVIDER, RESEND_API_KEY"
  ],
  "changeType": "feature",
  "scope": "large",
  "scoutPolicy": "required",
  "affectedAreas": [
    "packages/worker/ (new email worker, queue wiring for price-drop and all-time-low events)",
    "packages/worker/src/queues.ts (new notification/email queue)",
    "packages/db/src/schema.ts (potential alertNotifications schema extension)",
    "packages/api/src/ (unsubscribe endpoint with signed token verification)",
    "packages/api/src/routes/auth.ts (integrate verification and password reset email calls)",
    "new packages/email/ (EmailService, Resend SDK, React Email templates)",
    ".env.example (EMAIL_FROM, EMAIL_PROVIDER, RESEND_API_KEY)",
    "INFRASTRUCTURE.md (document new email environment variables)"
  ],
  "ambiguities": [
    "Should the email service be a new workspace package (packages/email) or embedded in packages/worker?",
    "Should there be a separate notificationQueue that aggregates price events into email jobs, or consume priceDropQueue/allTimeLowQueue directly?",
    "The alertNotifications table lacks email delivery status and provider message ID fields — should the schema be extended?",
    "What format and expiry should the signed unsubscribe token use (JWT vs HMAC, permanent vs time-limited)?",
    "Should sendVerificationEmail and sendPasswordResetEmail be wired into existing auth routes in this issue or left for issue #15?",
    "Should the 'manage all alerts' link in emails require login or use a signed token for passwordless access?",
    "Should there be deduplication logic to prevent multiple emails for the same alert when multiple stores trigger simultaneously?"
  ]
}
```
