# Session: session-003 - Worker notification queue and email dispatch

**Rationale:** The notification queue, alert-matching logic, and email worker are all worker-layer changes with a tight dependency chain — the queue must be defined before the notification processor and email worker can use it. Grouping them lets the agent see the queue shape when writing the consumers.
**Dependencies:** session-001

## Steps

### session-003-step-001: Add emailQueue to worker queues
**Description:** Add a new emailQueue BullMQ Queue (name: 'email') and emailQueueEvents QueueEvents to packages/worker/src/queues.ts. Export both. Update the queues test to verify the new queue is created and exported.
**Files:** packages/worker/src/queues.ts, packages/worker/tests/queues.test.ts
**Complexity:** simple
**Acceptance Criteria:**
- `emailQueue` is exported from queues.ts as a BullMQ Queue with name 'email'
- `emailQueueEvents` is exported from queues.ts as a QueueEvents for 'email'
- Queues test verifies `emailQueue` and `emailQueueEvents` are defined and correctly named

### session-003-step-002: Add notification processor for price-drop and all-time-low events
**Description:** Add BullMQ Workers in packages/worker/src/index.ts that consume from 'price-drop' and 'all-time-low' queues. For each event, query priceAlerts (active alerts for the gameId where targetPrice >= newPrice), join with users to get email, and enqueue a job on emailQueue per matching alert with userId, alertId, user email, game info, and store listing price data.
**Files:** packages/worker/src/index.ts
**Complexity:** complex
**Acceptance Criteria:**
- A new BullMQ Worker consumes from the 'price-drop' queue
- A new BullMQ Worker consumes from the 'all-time-low' queue
- Workers query active priceAlerts matching the gameId where targetPrice >= triggeredPrice
- Workers join with users table to retrieve the user email
- Workers enqueue one email job per matching alert on the emailQueue with userId, alertId, email, game title, and price data
- Workers handle the case where no matching alerts exist (no-op)

### session-003-step-003: Add email worker consumer
**Description:** Add a BullMQ Worker in packages/worker/src/index.ts that consumes from the 'email' queue. Each job calls sendPriceAlert from @taad/email with the job data (userId, alertId, priceData including store listings with referral URLs built via buildReferralUrl from @taad/scraper). Add @taad/email dependency to packages/worker/package.json.
**Files:** packages/worker/src/index.ts, packages/worker/package.json
**Complexity:** moderate
**Acceptance Criteria:**
- A new BullMQ Worker consumes from the 'email' queue
- `packages/worker/package.json` lists `@taad/email: workspace:*` as a dependency
- Worker calls `sendPriceAlert` from `@taad/email` for each job
- Worker builds referral URLs using `buildReferralUrl` from `@taad/scraper` for each store listing
- Worker handles email send failures gracefully (logs error, does not crash)

### session-003-step-004: Update worker graceful shutdown
**Description:** Update the SIGTERM handler in packages/worker/src/index.ts to close the new price-drop worker, all-time-low worker, and email worker alongside the existing scrape/ingest/featured-scrape workers.
**Files:** packages/worker/src/index.ts
**Complexity:** simple
**Acceptance Criteria:**
- SIGTERM handler closes the price-drop notification worker
- SIGTERM handler closes the all-time-low notification worker
- SIGTERM handler closes the email worker
- Existing scrapeWorker, ingestWorker, and featuredScrapeWorker shutdown calls remain unchanged