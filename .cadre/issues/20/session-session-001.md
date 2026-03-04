# Session: session-001 - Schema extension, email package, and config

**Rationale:** All foundational pieces — the schema columns, shared email package, and env config — must exist before the API and worker can integrate. The email package's send-logging method depends on the extended schema, so they belong in the same session.
**Dependencies:** none

## Steps

### session-001-step-001: Extend alertNotifications schema with email tracking columns
**Description:** Add emailStatus (varchar, e.g. 'sent'/'failed'/'pending'), emailMessageId (text, provider message ID), and emailProvider (varchar, e.g. 'resend') columns to the alertNotifications table in packages/db/src/schema.ts. Update the schema test to assert the new columns exist.
**Files:** packages/db/src/schema.ts, packages/db/tests/schema.test.ts
**Complexity:** simple
**Acceptance Criteria:**
- `alertNotifications` table includes `emailStatus` varchar column
- `alertNotifications` table includes `emailMessageId` text column
- `alertNotifications` table includes `emailProvider` varchar column
- Schema test asserts the three new columns are present on `alertNotifications`

### session-001-step-002: Create packages/email workspace package with Resend SDK
**Description:** Create a new packages/email package with package.json (depends on resend SDK and @taad/db), tsconfig.json, and src/index.ts exporting an EmailService with sendVerificationEmail(email, token), sendPasswordResetEmail(email, token), and sendPriceAlert(userId, alertId, priceData) methods. Each method uses the Resend SDK to send email and logs the result to the alertNotifications table (for sendPriceAlert) or console (for auth emails). Reads EMAIL_FROM, RESEND_API_KEY from env.
**Files:** packages/email/package.json, packages/email/tsconfig.json, packages/email/src/index.ts
**Complexity:** complex
**Acceptance Criteria:**
- `packages/email/package.json` declares `@taad/email` with `resend` and `@taad/db` as dependencies
- `packages/email/src/index.ts` exports `sendVerificationEmail(email, token)` that sends via Resend SDK
- `packages/email/src/index.ts` exports `sendPasswordResetEmail(email, token)` that sends via Resend SDK
- `packages/email/src/index.ts` exports `sendPriceAlert(userId, alertId, priceData)` that sends via Resend SDK and logs to `alertNotifications`
- All methods read `RESEND_API_KEY` and `EMAIL_FROM` from environment variables
- All methods handle Resend SDK errors gracefully without crashing

### session-001-step-003: Create HTML email templates
**Description:** Add email template functions in packages/email/src/templates.ts for: price alert (game image, title, alert condition, price breakdown with per-store referral buy links, unsubscribe link), email verification (verification URL), and password reset (reset URL). Templates use inline CSS for email client compatibility.
**Files:** packages/email/src/templates.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `priceAlertTemplate` function accepts game title, image URL, price data array (store name, price, referral URL), and unsubscribe URL, and returns an HTML string
- `verificationTemplate` function accepts a verification URL and returns an HTML string
- `passwordResetTemplate` function accepts a reset URL and returns an HTML string
- Templates use inline CSS styles (no external stylesheets) for email client compatibility
- Price alert template includes referral buy links for each store listing

### session-001-step-004: Add email environment variables and documentation
**Description:** Add EMAIL_FROM, EMAIL_PROVIDER, and RESEND_API_KEY to .env.example. Update the Worker and API environment variable tables in INFRASTRUCTURE.md to document the new email-related variables.
**Files:** .env.example, INFRASTRUCTURE.md
**Complexity:** simple
**Acceptance Criteria:**
- `.env.example` includes `EMAIL_FROM`, `EMAIL_PROVIDER`, and `RESEND_API_KEY` entries with placeholder values
- `INFRASTRUCTURE.md` Worker env table includes `EMAIL_FROM`, `EMAIL_PROVIDER`, `RESEND_API_KEY`
- `INFRASTRUCTURE.md` API env table includes `EMAIL_FROM`, `EMAIL_PROVIDER`, `RESEND_API_KEY`