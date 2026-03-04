# Session: session-002 - Slack service and API test endpoint

**Rationale:** The Slack service, validation schema, route, and API mounting form a tight dependency chain — the validation is consumed by the route, the route calls the Slack service, and the route must be mounted in the API index.
**Dependencies:** session-001

## Steps

### session-002-step-001: Add webhook URL validation schema
**Description:** Add a `testSlackSchema` Zod object to packages/api/src/lib/validation.ts that validates a `webhookUrl` string field matching the Slack webhook URL pattern (https://hooks.slack.com/services/...).
**Files:** packages/api/src/lib/validation.ts
**Complexity:** simple
**Acceptance Criteria:**
- `testSlackSchema` is exported from validation.ts
- Schema accepts valid Slack webhook URLs (https://hooks.slack.com/services/T.../B.../...)
- Schema rejects non-Slack URLs and empty strings

### session-002-step-002: Create SlackNotificationService
**Description:** Create packages/api/src/lib/slack.ts exporting a `sendPriceAlert(webhookUrl: string, alertData: PriceAlertData): Promise<SlackResult>` function that POSTs a Slack Block Kit payload (game image, current price, original price, discount percentage, buy link, 'see all prices' link) and returns a result indicating success, invalid_webhook (4xx), or transient_error (5xx/network).
**Files:** packages/api/src/lib/slack.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `sendPriceAlert` is exported from slack.ts
- Function POSTs JSON to the provided webhook URL
- Payload uses Slack Block Kit format with section blocks for game image, price details, discount, and action buttons
- Returns `{ ok: true }` on 2xx responses
- Returns `{ ok: false, reason: 'invalid_webhook' }` on 4xx responses
- Returns `{ ok: false, reason: 'transient_error' }` on 5xx or network errors

### session-002-step-003: Create user-alerts route with test-slack endpoint
**Description:** Create packages/api/src/routes/user-alerts.ts with a `POST /test-slack` endpoint protected by authMiddleware. The endpoint accepts a webhook URL in the request body (validated by testSlackSchema), encrypts and stores it on the user record, sends a sample Slack message via SlackNotificationService, and logs the attempt to alertNotifications with channel='slack'.
**Files:** packages/api/src/routes/user-alerts.ts
**Complexity:** moderate
**Acceptance Criteria:**
- Route exports a `createUserAlertsApp` factory function following the existing route pattern
- `POST /test-slack` requires a valid Bearer token (authMiddleware)
- Request body is validated against `testSlackSchema`
- Webhook URL is encrypted before storage using the encryption utility
- A sample Slack message is sent to the provided webhook URL
- On success, returns 200 with a success message
- On invalid webhook (4xx from Slack), returns 400 with an error message

### session-002-step-004: Mount user-alerts routes in API index
**Description:** Import `createUserAlertsApp` in packages/api/src/index.ts and mount it at `/user/me/alerts` on the v1 router.
**Files:** packages/api/src/index.ts
**Complexity:** simple
**Acceptance Criteria:**
- `createUserAlertsApp` is imported from `./routes/user-alerts.js`
- Route is mounted at `v1.route('/user/me/alerts', createUserAlertsApp(getRedis))`
- Existing routes continue to function unchanged