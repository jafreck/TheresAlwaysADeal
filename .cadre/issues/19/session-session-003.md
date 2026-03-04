# Session: session-003 - Worker Alert Evaluation Logic

**Rationale:** The alert evaluation logic in the worker consumes price-drop and all-time-low queue events and is independent of the API CRUD routes. It only depends on the expanded DB schema from session 1.
**Dependencies:** session-001

## Steps

### session-003-step-001: Add notification queue definition
**Description:** Add a notificationQueue (and its QueueEvents) to packages/worker/src/queues.ts for enqueuing notification jobs when alerts trigger.
**Files:** packages/worker/src/queues.ts
**Complexity:** simple
**Acceptance Criteria:**
- `notificationQueue` is exported as a new BullMQ Queue named 'notification'
- `notificationQueueEvents` is exported as the corresponding QueueEvents
- Existing queue definitions are not modified

### session-003-step-002: Add alert evaluation workers for price-drop and all-time-low events
**Description:** Add two new BullMQ workers in packages/worker/src/index.ts: one consuming the price-drop queue and one consuming the all-time-low queue. Each worker queries active priceAlerts for the affected gameId (optionally filtered by storeId), evaluates trigger conditions (current_price <= targetPrice, discount_percent >= targetDiscountPercent, or all-time-low event), enqueues a notification job to notificationQueue, and inserts a row into alertNotifications. Price-drop alerts keep isActive=true for re-notification; all-time-low alerts also keep isActive=true. Add the new workers to graceful shutdown.
**Files:** packages/worker/src/index.ts
**Complexity:** complex
**Acceptance Criteria:**
- A new Worker consumes jobs from the 'price-drop' queue and evaluates active alerts for the given gameId
- A new Worker consumes jobs from the 'all-time-low' queue and evaluates active alerts for the given gameId
- For price-drop events: alerts trigger when current price <= targetPrice or discount >= targetDiscountPercent
- For all-time-low events: all active alerts for the game trigger unconditionally
- When an alert triggers, a job is added to `notificationQueue` with alert and price details
- When an alert triggers, a row is inserted into `alertNotifications` with alertId, storeListingId, and triggeredPrice
- Triggered price-drop alerts remain active (isActive is not set to false)
- Both new workers are included in the graceful shutdown handler
- The notificationQueue is imported from './queues.js'