# Session: session-002 - Alert CRUD API Endpoints

**Rationale:** The five alert endpoints all share the same auth middleware, DB queries, and validation schemas. They form a single cohesive route file that should be built and mounted together.
**Dependencies:** session-001

## Steps

### session-002-step-001: Create alerts route with CRUD and pause endpoints
**Description:** Create packages/api/src/routes/alerts.ts implementing GET / (list alerts), POST / (create alert with gameId validation and 100-alert cap), PATCH /:alertId (update alert with ownership check), DELETE /:alertId (delete alert with ownership check), and PATCH /:alertId/pause (set isActive with ownership check). Use authMiddleware for all endpoints. Encrypt/decrypt notifySlackWebhook on write/read.
**Files:** packages/api/src/routes/alerts.ts
**Complexity:** complex
**Acceptance Criteria:**
- GET / returns all alerts for the authenticated user with decrypted Slack webhooks
- POST / validates the request body with createAlertSchema, verifies gameId exists in the games table, enforces the 100 active alert cap, encrypts notifySlackWebhook before insert, and returns 201 with the created alert
- POST / returns 400 if gameId does not exist in the database
- POST / returns 409 or 400 if the user already has 100 active alerts
- PATCH /:alertId validates the body with updateAlertSchema, checks ownership (userId matches JWT sub), encrypts notifySlackWebhook if provided, and returns the updated alert
- PATCH /:alertId returns 404 if the alert does not exist or is not owned by the user
- DELETE /:alertId checks ownership and deletes the alert, returning 204
- DELETE /:alertId returns 404 if the alert does not exist or is not owned by the user
- PATCH /:alertId/pause accepts { isActive: boolean }, checks ownership, updates isActive, and returns the updated alert
- All endpoints use authMiddleware to require a valid JWT

### session-002-step-002: Mount alerts route in API index
**Description:** Import the alerts route in packages/api/src/index.ts and mount it on the v1 router under /user/me/alerts with the auth middleware applied.
**Files:** packages/api/src/index.ts
**Complexity:** simple
**Acceptance Criteria:**
- The alerts route is imported from './routes/alerts.js'
- The alerts route is mounted at `/user/me/alerts` on the v1 router
- The authMiddleware is applied to the alerts route (either in the route file or at mount time)
- Existing route mounts are not modified

### session-002-step-003: Update OpenAPI spec with alert endpoints
**Description:** Add OpenAPI path definitions for all five alert endpoints (GET, POST, PATCH, DELETE, PATCH pause) to the spec object in packages/api/src/openapi.ts, including request/response schemas and auth requirements.
**Files:** packages/api/src/openapi.ts
**Complexity:** moderate
**Acceptance Criteria:**
- OpenAPI spec includes path definitions for GET /user/me/alerts, POST /user/me/alerts, PATCH /user/me/alerts/{alertId}, DELETE /user/me/alerts/{alertId}, and PATCH /user/me/alerts/{alertId}/pause
- All alert endpoints specify 401 Unauthorized response for missing/invalid auth
- POST endpoint schema documents the request body matching createAlertSchema
- PATCH update endpoint schema documents the optional fields matching updateAlertSchema
- Endpoints are tagged with 'Alerts'