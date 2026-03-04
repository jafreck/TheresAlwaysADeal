# Session: session-001 - Schema columns and validation schemas

**Rationale:** The DB schema columns and Zod validation schemas are foundational — the route file in session-002 depends on both being in place.
**Dependencies:** none

## Steps

### session-001-step-001: Add user profile columns to schema
**Description:** Add displayName, emailAlerts, slackAlertsEnabled, slackWebhookUrl, and defaultAlertCurrency columns to the users table in the Drizzle schema. Update the schema test to verify the new columns exist.
**Files:** packages/db/src/schema.ts, packages/db/tests/schema.test.ts
**Complexity:** simple
**Acceptance Criteria:**
- `users` table in `packages/db/src/schema.ts` has `displayName` column (varchar, nullable)
- `users` table has `emailAlerts` column (boolean, default false)
- `users` table has `slackAlertsEnabled` column (boolean, default false)
- `users` table has `slackWebhookUrl` column (text, nullable)
- `users` table has `defaultAlertCurrency` column (varchar, default 'USD')
- `packages/db/tests/schema.test.ts` checks for all five new columns in the users describe block
- Existing schema tests continue to pass

### session-001-step-002: Add Zod schemas for user profile endpoints
**Description:** Add updateProfileSchema, changePasswordSchema, and deleteAccountSchema to the validation module. Update validation tests to cover the new schemas.
**Files:** packages/api/src/lib/validation.ts, packages/api/tests/lib/validation.test.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `updateProfileSchema` validates optional `displayName` (string, 1-255 chars), optional `emailAlerts` (boolean), optional `slackAlertsEnabled` (boolean), optional `slackWebhookUrl` (string, url or null), optional `defaultAlertCurrency` (string, 3 chars)
- `changePasswordSchema` validates required `currentPassword` (string, min 1) and `newPassword` (string, min 8)
- `deleteAccountSchema` is exported (empty object schema or optional confirmation field)
- Validation tests cover valid inputs, boundary cases, and rejection of invalid inputs for all three new schemas
- Existing validation tests continue to pass