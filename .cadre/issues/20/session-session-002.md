# Session: session-002 - API email integration and unsubscribe endpoint

**Rationale:** Replacing the email stub in auth routes and adding the unsubscribe endpoint are both API-layer changes that share context (JWT/token utilities, route mounting, Hono patterns). The agent benefits from seeing the import replacement before building the new unsubscribe route.
**Dependencies:** session-001

## Steps

### session-002-step-001: Replace email stub with @taad/email in API
**Description:** Add @taad/email as a workspace dependency in packages/api/package.json. Update the import in packages/api/src/routes/auth.ts to use sendVerificationEmail and sendPasswordResetEmail from @taad/email instead of the local stub. Remove or deprecate the old packages/api/src/lib/email.ts stub file. Update packages/api/tests/lib/email.test.ts to test the new @taad/email integration (mock the Resend SDK).
**Files:** packages/api/package.json, packages/api/src/routes/auth.ts, packages/api/src/lib/email.ts, packages/api/tests/lib/email.test.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `packages/api/package.json` lists `@taad/email: workspace:*` as a dependency
- `packages/api/src/routes/auth.ts` imports `sendVerificationEmail` and `sendPasswordResetEmail` from `@taad/email`
- Old stub file `packages/api/src/lib/email.ts` is removed or replaced with a re-export from @taad/email
- Existing auth route tests continue to pass (email calls are mocked)

### session-002-step-002: Add unsubscribe token utility and validation schema
**Description:** Add signUnsubscribeToken(alertId) and verifyUnsubscribeToken(token) functions to packages/api/src/lib/jwt.ts using HMAC-SHA256 with the existing JWT_SECRET. The token encodes the alertId and has no expiry (permanent unsubscribe). Add an unsubscribeSchema Zod validator in packages/api/src/lib/validation.ts for the token query parameter.
**Files:** packages/api/src/lib/jwt.ts, packages/api/src/lib/validation.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `signUnsubscribeToken(alertId)` is exported from jwt.ts and returns a URL-safe token encoding the alertId
- `verifyUnsubscribeToken(token)` is exported from jwt.ts and returns the decoded alertId or throws on invalid token
- `unsubscribeSchema` is exported from validation.ts and validates a required `token` query string parameter
- Token verification rejects tampered tokens

### session-002-step-003: Create unsubscribe route and mount in API
**Description:** Create packages/api/src/routes/alerts.ts with a GET /unsubscribe endpoint that reads the signed token from query params, verifies it via verifyUnsubscribeToken, and sets isActive=false on the matching priceAlert. No authentication required. Mount the alerts route at /api/v1/alerts in packages/api/src/index.ts.
**Files:** packages/api/src/routes/alerts.ts, packages/api/src/index.ts
**Complexity:** moderate
**Acceptance Criteria:**
- GET `/api/v1/alerts/unsubscribe?token=<token>` deactivates the price alert matching the alertId in the token
- Endpoint returns 200 with a success message on valid token
- Endpoint returns 400 on missing or invalid token
- Endpoint does not require authentication (no auth middleware)
- Route is mounted in packages/api/src/index.ts under `/api/v1/alerts`