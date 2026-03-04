# Task Result: session-002 - Alert CRUD API Endpoints

## Changes Made
- `packages/api/src/routes/alerts.ts`: Created new route file with 5 endpoints (GET /, POST /, PATCH /:alertId, DELETE /:alertId, PATCH /:alertId/pause) using authMiddleware, Zod validation, encrypt/decrypt for Slack webhooks, gameId validation, and 100-alert cap enforcement
- `packages/api/src/index.ts`: Imported `alertsApp` and mounted it at `/user/me/alerts` on the v1 router
- `packages/api/src/openapi.ts`: Added OpenAPI path definitions for all 5 alert endpoints with request/response schemas, Alert component schema, and BearerAuth security scheme; all tagged with "Alerts"

## Files Modified
- packages/api/src/index.ts
- packages/api/src/openapi.ts

## Files Created
- packages/api/src/routes/alerts.ts

## Notes
- Auth middleware is applied at the route level (`app.use("*", authMiddleware)`) within alerts.ts, consistent with the pattern of route-level middleware
- Hono app uses typed Variables (`{ user: Record<string, unknown> }`) to resolve TypeScript type errors with `c.get("user")`
- `targetPrice` and `targetDiscountPercent` are stored as decimal strings in the DB (matching the schema's `decimal` type) but accepted as numbers in the Zod schema, with `.toString()` conversion on insert/update
- The 100-alert cap counts only active alerts (`isActive = true`)
- POST returns 400 for invalid gameId, 409 for alert cap exceeded
- All ownership checks return 404 (not 403) to avoid leaking alert existence
