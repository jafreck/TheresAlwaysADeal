# Session: session-002 - User profile routes, mounting, and OpenAPI

**Rationale:** All four endpoints share the same route file and the same auth middleware pattern — they form a cohesive unit. Mounting and OpenAPI specs are trivial additions that belong in the same session.
**Dependencies:** session-001

## Steps

### session-002-step-001: Create user route file with all four endpoints
**Description:** Create packages/api/src/routes/user.ts exporting a createUserApp factory (following the auth route pattern) with GET /me, PATCH /me, POST /me/change-password, and DELETE /me endpoints. All endpoints use authMiddleware. GET returns the user profile with computed steamLinked. PATCH updates displayName and notification preferences. POST /change-password verifies current password before setting new one. DELETE anonymizes PII per GDPR.
**Files:** packages/api/src/routes/user.ts
**Complexity:** complex
**Acceptance Criteria:**
- `createUserApp` is exported as a named function
- All four routes are protected by `authMiddleware`
- GET /me returns id, email, displayName (from name column or new displayName column), emailVerified, steamId, steamLinked (computed boolean), notificationPreferences (emailAlerts, slackAlertsEnabled, slackWebhookUrl, defaultAlertCurrency), and createdAt
- PATCH /me validates input with `updateProfileSchema`, updates only provided fields, returns updated profile
- POST /me/change-password validates input with `changePasswordSchema`, verifies current password with `verifyPassword`, hashes new password with `hashPassword`, returns success message
- DELETE /me hashes email with `hashPassword`, replaces name/displayName with 'deleted', nullifies passwordHash/steamId/steamAccessToken/emailVerificationToken/passwordResetToken, sets emailVerified to false, returns success message
- All endpoints return appropriate HTTP status codes (200 for GET/PATCH/DELETE, 200 for change-password success, 400 for validation errors, 401 for auth failures, 404 for user not found)

### session-002-step-002: Mount user routes in API index
**Description:** Import createUserApp in packages/api/src/index.ts and mount it on the v1 router under /user, passing getRedis.
**Files:** packages/api/src/index.ts
**Complexity:** simple
**Acceptance Criteria:**
- `createUserApp` is imported from `./routes/user.js`
- User routes are mounted at `/user` on the v1 router
- Existing routes are not affected

### session-002-step-003: Add OpenAPI specs for user endpoints
**Description:** Add OpenAPI path entries for GET /user/me, PATCH /user/me, POST /user/me/change-password, and DELETE /user/me to the spec object in packages/api/src/openapi.ts, including request bodies and response schemas.
**Files:** packages/api/src/openapi.ts
**Complexity:** moderate
**Acceptance Criteria:**
- OpenAPI spec includes path `/user/me` with `get`, `patch`, and `delete` operations
- OpenAPI spec includes path `/user/me/change-password` with `post` operation
- All four operations include `security` requiring Bearer auth
- Request body schemas match the Zod validation schemas
- Response schemas include the profile object shape and error/message responses

### session-002-step-004: Add user route tests
**Description:** Create packages/api/tests/routes/user.test.ts following the auth test mock pattern (mock db, password, jwt, email, auth middleware). Test all four endpoints: GET /me returns profile, PATCH /me updates fields, POST /me/change-password rejects wrong password and accepts correct one, DELETE /me anonymizes user data.
**Files:** packages/api/tests/routes/user.test.ts
**Complexity:** complex
**Acceptance Criteria:**
- Test file mocks @taad/db, drizzle-orm, password, jwt, and auth middleware following the pattern in auth.test.ts
- GET /me test: returns 200 with complete profile object including computed steamLinked field
- GET /me test: returns 401 when no auth header provided
- PATCH /me test: returns 200 with updated profile after valid update
- PATCH /me test: returns 400 for invalid input (e.g., displayName too long)
- POST /me/change-password test: returns 200 on successful password change
- POST /me/change-password test: returns 400 when current password is incorrect
- DELETE /me test: returns 200 and calls db.update with anonymized values
- All tests pass with `npx vitest run`