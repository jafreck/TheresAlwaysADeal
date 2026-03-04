# Scout Report

## Relevant Files

| File | Reason |
|------|--------|
| `packages/db/src/schema.ts` | Users table must be extended with `displayName`, `emailAlerts`, `slackAlertsEnabled`, `slackWebhookUrl`, and `defaultAlertCurrency` columns |
| `packages/api/src/routes/auth.ts` | Existing auth route file — pattern to follow for new user routes; shares DB/password/JWT imports |
| `packages/api/src/index.ts` | Must mount new user routes under `/api/v1/user` |
| `packages/api/src/lib/validation.ts` | Must add Zod schemas for profile update, change-password, and account deletion requests |
| `packages/api/src/middleware/auth.ts` | Used by all four new endpoints for JWT authentication; payload exposes `sub` (user ID) and `email` |
| `packages/api/src/lib/password.ts` | `hashPassword` and `verifyPassword` needed for change-password and GDPR deletion (hashing PII) |
| `packages/api/src/lib/email.ts` | May need a new `sendEmailChangeVerification` helper if email changes are in scope |
| `packages/api/src/lib/jwt.ts` | Defines token signing/verification; JWT payload shape (`sub`, `email`) is relevant for user lookup |
| `packages/api/src/lib/response.ts` | Envelope response helper — may be used for profile response formatting |
| `packages/db/src/index.ts` | Re-exports schema and `db` instance; new columns will be automatically available |
| `packages/api/src/openapi.ts` | Should be updated with OpenAPI specs for the four new user endpoints |
| `packages/db/drizzle.config.ts` | Migration config — a new migration will be needed for the added columns |
| `packages/db/tests/schema.test.ts` | Must be updated to test the new user columns |
| `packages/api/tests/routes/auth.test.ts` | Existing route test — pattern to follow for new user route tests (mock setup for db, password, jwt, email) |
| `packages/api/tests/lib/validation.test.ts` | Must be updated to test new Zod schemas for profile update, change-password, and deletion |
| `packages/api/tests/middleware/auth.test.ts` | Existing auth middleware test — confirms middleware pattern for protected routes |

## Dependency Map

- `packages/api/src/routes/auth.ts` imports:
  - `@taad/db` → `db`, `users` (from `packages/db/src/index.ts` → `packages/db/src/schema.ts`)
  - `../lib/password.js` → `hashPassword`, `verifyPassword`
  - `../lib/jwt.js` → `signAccessToken`, `signRefreshToken`, `verifyRefreshToken`
  - `../lib/email.js` → `sendVerificationEmail`, `sendPasswordResetEmail`
  - `../lib/validation.js` → `registerSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- New `packages/api/src/routes/user.ts` (to be created) will follow the same import pattern:
  - `@taad/db` → `db`, `users`
  - `../lib/password.js` → `hashPassword`, `verifyPassword`
  - `../lib/validation.js` → new profile/password/deletion schemas
  - `../middleware/auth.js` → `authMiddleware`
  - `../lib/email.js` → (optional) email change verification helper
- `packages/api/src/index.ts` imports route factories and mounts them on `v1` router
- `packages/api/src/middleware/auth.ts` imports `../lib/jwt.js` → `verifyAccessToken`
- `packages/db/src/index.ts` re-exports everything from `packages/db/src/schema.ts`
- `packages/api/src/lib/validation.ts` is standalone (only depends on `zod`)
- `packages/api/src/lib/password.ts` is standalone (only depends on `bcryptjs`)

## Test Files

- `packages/api/tests/routes/auth.test.ts` — covers `auth.ts` routes; provides the mock pattern for DB, password, JWT, and email modules
- `packages/api/tests/middleware/auth.test.ts` — covers `authMiddleware` (complete)
- `packages/api/tests/lib/validation.test.ts` — covers existing validation schemas; must be extended for new schemas
- `packages/api/tests/lib/password.test.ts` — covers `hashPassword` and `verifyPassword` (complete)
- `packages/api/tests/lib/jwt.test.ts` — covers JWT utilities (complete)
- `packages/api/tests/lib/email.test.ts` — covers email stubs (complete)
- `packages/db/tests/schema.test.ts` — covers DB schema column existence; must be updated for new user columns
- **Gap**: No test file exists for `packages/api/src/routes/user.ts` (new file — `packages/api/tests/routes/user.test.ts` must be created)

## Estimated Change Surface

7–9 files require changes. The new `packages/api/src/routes/user.ts` is the largest piece of new code (~150–200 lines) containing all four endpoints (GET, PATCH, POST change-password, DELETE). `packages/db/src/schema.ts` requires ~5 new column definitions. `packages/api/src/lib/validation.ts` needs ~30 lines for new Zod schemas. `packages/api/src/index.ts` needs ~3 lines to mount the user routes. `packages/api/src/openapi.ts` needs ~80 lines for four new endpoint specs. Test files (`user.test.ts` new, `validation.test.ts` update, `schema.test.ts` update) add ~200 lines total. Risk areas: `schema.ts` is imported by multiple packages (db, api, worker) — column additions are additive and low-risk. The auth route is a good reference but the new route must correctly use `authMiddleware` on all endpoints. GDPR deletion logic (PII hashing) is the most nuanced piece requiring careful implementation.

```cadre-json
{
  "relevantFiles": [
    { "path": "packages/db/src/schema.ts", "reason": "Users table must be extended with displayName and notification preference columns (emailAlerts, slackAlertsEnabled, slackWebhookUrl, defaultAlertCurrency)" },
    { "path": "packages/api/src/routes/auth.ts", "reason": "Existing auth route file — pattern to follow for new user routes; shares DB/password/JWT imports" },
    { "path": "packages/api/src/index.ts", "reason": "Must mount new user routes under /api/v1/user" },
    { "path": "packages/api/src/lib/validation.ts", "reason": "Must add Zod schemas for profile update, change-password, and account deletion requests" },
    { "path": "packages/api/src/middleware/auth.ts", "reason": "Used by all four new endpoints for JWT authentication; payload exposes sub (user ID) and email" },
    { "path": "packages/api/src/lib/password.ts", "reason": "hashPassword and verifyPassword needed for change-password and GDPR deletion (hashing PII)" },
    { "path": "packages/api/src/lib/email.ts", "reason": "May need a new sendEmailChangeVerification helper if email changes are in scope" },
    { "path": "packages/api/src/lib/jwt.ts", "reason": "Defines token signing/verification; JWT payload shape (sub, email) is relevant for user lookup" },
    { "path": "packages/api/src/lib/response.ts", "reason": "Envelope response helper — may be used for profile response formatting" },
    { "path": "packages/db/src/index.ts", "reason": "Re-exports schema and db instance; new columns will be automatically available" },
    { "path": "packages/api/src/openapi.ts", "reason": "Should be updated with OpenAPI specs for the four new user endpoints" },
    { "path": "packages/db/drizzle.config.ts", "reason": "Migration config — a new migration will be needed for the added columns" },
    { "path": "packages/db/tests/schema.test.ts", "reason": "Must be updated to test the new user columns" },
    { "path": "packages/api/tests/routes/auth.test.ts", "reason": "Existing route test — pattern to follow for new user route tests (mock setup for db, password, jwt, email)" },
    { "path": "packages/api/tests/lib/validation.test.ts", "reason": "Must be updated to test new Zod schemas for profile update, change-password, and deletion" },
    { "path": "packages/api/tests/middleware/auth.test.ts", "reason": "Existing auth middleware test — confirms middleware pattern for protected routes" }
  ],
  "dependencyMap": {
    "packages/db/src/schema.ts": [],
    "packages/db/src/index.ts": ["packages/db/src/schema.ts"],
    "packages/api/src/lib/validation.ts": [],
    "packages/api/src/lib/password.ts": [],
    "packages/api/src/lib/jwt.ts": [],
    "packages/api/src/lib/email.ts": [],
    "packages/api/src/lib/response.ts": [],
    "packages/api/src/middleware/auth.ts": ["packages/api/src/lib/jwt.ts"],
    "packages/api/src/routes/auth.ts": [
      "packages/db/src/index.ts",
      "packages/api/src/lib/password.ts",
      "packages/api/src/lib/jwt.ts",
      "packages/api/src/lib/email.ts",
      "packages/api/src/lib/validation.ts"
    ],
    "packages/api/src/index.ts": [
      "packages/api/src/middleware/rate-limit.ts",
      "packages/api/src/middleware/cache.ts",
      "packages/api/src/routes/games.ts",
      "packages/api/src/routes/deals.ts",
      "packages/api/src/routes/stores.ts",
      "packages/api/src/routes/auth.ts",
      "packages/api/src/openapi.ts"
    ],
    "packages/api/src/openapi.ts": [],
    "packages/db/drizzle.config.ts": ["packages/db/src/schema.ts"]
  },
  "testFiles": [
    "packages/api/tests/routes/auth.test.ts",
    "packages/api/tests/middleware/auth.test.ts",
    "packages/api/tests/lib/validation.test.ts",
    "packages/api/tests/lib/password.test.ts",
    "packages/api/tests/lib/jwt.test.ts",
    "packages/api/tests/lib/email.test.ts",
    "packages/db/tests/schema.test.ts"
  ],
  "estimatedChanges": [
    { "path": "packages/db/src/schema.ts", "linesEstimate": 10 },
    { "path": "packages/api/src/routes/user.ts", "linesEstimate": 180 },
    { "path": "packages/api/src/lib/validation.ts", "linesEstimate": 30 },
    { "path": "packages/api/src/index.ts", "linesEstimate": 5 },
    { "path": "packages/api/src/openapi.ts", "linesEstimate": 80 },
    { "path": "packages/api/src/lib/email.ts", "linesEstimate": 10 },
    { "path": "packages/db/tests/schema.test.ts", "linesEstimate": 15 },
    { "path": "packages/api/tests/lib/validation.test.ts", "linesEstimate": 60 },
    { "path": "packages/api/tests/routes/user.test.ts", "linesEstimate": 200 }
  ]
}
```
