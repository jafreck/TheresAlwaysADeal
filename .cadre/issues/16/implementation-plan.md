# Implementation Plan — User Profile Management Endpoints (#16)

## Overview

This plan implements four authenticated user profile endpoints (`GET /api/v1/user/me`, `PATCH /api/v1/user/me`, `POST /api/v1/user/me/change-password`, `DELETE /api/v1/user/me`) along with the required schema changes, validation schemas, and route mounting.

## Design Decisions

- **`name` → `displayName`**: The existing `name` column on the `users` table will be aliased as `displayName` in the API response rather than renamed, to avoid a breaking migration. A new `displayName` column is added alongside `name` for clarity going forward.
- **Email change**: Deferred — the `PATCH` endpoint only supports `displayName` and notification preferences as specified in the issue's updatable fields list.
- **`steamLinked`**: Computed from `steamId IS NOT NULL` — no dependency on #17.
- **GDPR deletion**: Anonymizes email and name with hashed values, nullifies password, Steam tokens, and verification tokens. Wishlists and price alerts are deleted (user data), price history rows are retained.
- **No re-authentication for DELETE**: Not specified in the issue, so omitted.

## Sessions

### Session 1: Schema & Validation Foundation
Adds new columns to the users table and new Zod validation schemas. These are prerequisites for all route work.

### Session 2: User Routes & Mounting
Creates the user route file with all four endpoints, mounts it in the API index, and adds OpenAPI specs.

---

```cadre-json
[
  {
    "id": "session-001",
    "name": "Schema columns and validation schemas",
    "rationale": "The DB schema columns and Zod validation schemas are foundational — the route file in session-002 depends on both being in place.",
    "dependencies": [],
    "steps": [
      {
        "id": "session-001-step-001",
        "name": "Add user profile columns to schema",
        "description": "Add displayName, emailAlerts, slackAlertsEnabled, slackWebhookUrl, and defaultAlertCurrency columns to the users table in the Drizzle schema. Update the schema test to verify the new columns exist.",
        "files": ["packages/db/src/schema.ts", "packages/db/tests/schema.test.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`users` table in `packages/db/src/schema.ts` has `displayName` column (varchar, nullable)",
          "`users` table has `emailAlerts` column (boolean, default false)",
          "`users` table has `slackAlertsEnabled` column (boolean, default false)",
          "`users` table has `slackWebhookUrl` column (text, nullable)",
          "`users` table has `defaultAlertCurrency` column (varchar, default 'USD')",
          "`packages/db/tests/schema.test.ts` checks for all five new columns in the users describe block",
          "Existing schema tests continue to pass"
        ]
      },
      {
        "id": "session-001-step-002",
        "name": "Add Zod schemas for user profile endpoints",
        "description": "Add updateProfileSchema, changePasswordSchema, and deleteAccountSchema to the validation module. Update validation tests to cover the new schemas.",
        "files": ["packages/api/src/lib/validation.ts", "packages/api/tests/lib/validation.test.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`updateProfileSchema` validates optional `displayName` (string, 1-255 chars), optional `emailAlerts` (boolean), optional `slackAlertsEnabled` (boolean), optional `slackWebhookUrl` (string, url or null), optional `defaultAlertCurrency` (string, 3 chars)",
          "`changePasswordSchema` validates required `currentPassword` (string, min 1) and `newPassword` (string, min 8)",
          "`deleteAccountSchema` is exported (empty object schema or optional confirmation field)",
          "Validation tests cover valid inputs, boundary cases, and rejection of invalid inputs for all three new schemas",
          "Existing validation tests continue to pass"
        ]
      }
    ]
  },
  {
    "id": "session-002",
    "name": "User profile routes, mounting, and OpenAPI",
    "rationale": "All four endpoints share the same route file and the same auth middleware pattern — they form a cohesive unit. Mounting and OpenAPI specs are trivial additions that belong in the same session.",
    "dependencies": ["session-001"],
    "steps": [
      {
        "id": "session-002-step-001",
        "name": "Create user route file with all four endpoints",
        "description": "Create packages/api/src/routes/user.ts exporting a createUserApp factory (following the auth route pattern) with GET /me, PATCH /me, POST /me/change-password, and DELETE /me endpoints. All endpoints use authMiddleware. GET returns the user profile with computed steamLinked. PATCH updates displayName and notification preferences. POST /change-password verifies current password before setting new one. DELETE anonymizes PII per GDPR.",
        "files": ["packages/api/src/routes/user.ts"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "`createUserApp` is exported as a named function",
          "All four routes are protected by `authMiddleware`",
          "GET /me returns id, email, displayName (from name column or new displayName column), emailVerified, steamId, steamLinked (computed boolean), notificationPreferences (emailAlerts, slackAlertsEnabled, slackWebhookUrl, defaultAlertCurrency), and createdAt",
          "PATCH /me validates input with `updateProfileSchema`, updates only provided fields, returns updated profile",
          "POST /me/change-password validates input with `changePasswordSchema`, verifies current password with `verifyPassword`, hashes new password with `hashPassword`, returns success message",
          "DELETE /me hashes email with `hashPassword`, replaces name/displayName with 'deleted', nullifies passwordHash/steamId/steamAccessToken/emailVerificationToken/passwordResetToken, sets emailVerified to false, returns success message",
          "All endpoints return appropriate HTTP status codes (200 for GET/PATCH/DELETE, 200 for change-password success, 400 for validation errors, 401 for auth failures, 404 for user not found)"
        ]
      },
      {
        "id": "session-002-step-002",
        "name": "Mount user routes in API index",
        "description": "Import createUserApp in packages/api/src/index.ts and mount it on the v1 router under /user, passing getRedis.",
        "files": ["packages/api/src/index.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`createUserApp` is imported from `./routes/user.js`",
          "User routes are mounted at `/user` on the v1 router",
          "Existing routes are not affected"
        ]
      },
      {
        "id": "session-002-step-003",
        "name": "Add OpenAPI specs for user endpoints",
        "description": "Add OpenAPI path entries for GET /user/me, PATCH /user/me, POST /user/me/change-password, and DELETE /user/me to the spec object in packages/api/src/openapi.ts, including request bodies and response schemas.",
        "files": ["packages/api/src/openapi.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "OpenAPI spec includes path `/user/me` with `get`, `patch`, and `delete` operations",
          "OpenAPI spec includes path `/user/me/change-password` with `post` operation",
          "All four operations include `security` requiring Bearer auth",
          "Request body schemas match the Zod validation schemas",
          "Response schemas include the profile object shape and error/message responses"
        ]
      },
      {
        "id": "session-002-step-004",
        "name": "Add user route tests",
        "description": "Create packages/api/tests/routes/user.test.ts following the auth test mock pattern (mock db, password, jwt, email, auth middleware). Test all four endpoints: GET /me returns profile, PATCH /me updates fields, POST /me/change-password rejects wrong password and accepts correct one, DELETE /me anonymizes user data.",
        "files": ["packages/api/tests/routes/user.test.ts"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "Test file mocks @taad/db, drizzle-orm, password, jwt, and auth middleware following the pattern in auth.test.ts",
          "GET /me test: returns 200 with complete profile object including computed steamLinked field",
          "GET /me test: returns 401 when no auth header provided",
          "PATCH /me test: returns 200 with updated profile after valid update",
          "PATCH /me test: returns 400 for invalid input (e.g., displayName too long)",
          "POST /me/change-password test: returns 200 on successful password change",
          "POST /me/change-password test: returns 400 when current password is incorrect",
          "DELETE /me test: returns 200 and calls db.update with anonymized values",
          "All tests pass with `npx vitest run`"
        ]
      }
    ]
  }
]
```
