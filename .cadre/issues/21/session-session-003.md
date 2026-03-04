# Session: session-003 - Worker Slack notification consumer

**Rationale:** The worker-side queue and consumer are independent from the API route but depend on the schema changes from session 1. They are grouped together because the queue definition and worker consumer form a producer-consumer pair.
**Dependencies:** session-001

## Steps

### session-003-step-001: Add slackNotificationQueue
**Description:** Add a `slackNotificationQueue` Queue instance and corresponding `slackNotificationQueueEvents` QueueEvents instance to packages/worker/src/queues.ts.
**Files:** packages/worker/src/queues.ts, packages/worker/tests/queues.test.ts
**Complexity:** simple
**Acceptance Criteria:**
- `slackNotificationQueue` is exported with queue name 'slack-notification'
- `slackNotificationQueueEvents` is exported for the same queue name
- Existing queue exports are unchanged
- Queue tests assert the new queue and queue events are created

### session-003-step-002: Add Slack notification worker with retry and error handling
**Description:** Add a Slack notification worker in packages/worker/src/index.ts that consumes from `slackNotificationQueue`. The worker looks up the user's encrypted webhook URL (per-alert first, then global), decrypts it, POSTs a Block Kit payload to Slack, and logs to `alertNotifications` with channel='slack'. On 4xx errors, the webhook is disabled (set to null) and a stub email notification is sent. On 5xx/network errors, the job is retried up to 3 times with exponential backoff. Also update the ingest worker to enqueue Slack notification jobs when price-drop or all-time-low events are emitted.
**Files:** packages/worker/src/index.ts
**Complexity:** complex
**Acceptance Criteria:**
- A new BullMQ Worker consumes from the 'slack-notification' queue
- Worker resolves webhook URL with per-alert priority over global user webhook
- Worker decrypts the webhook URL using AES-256-GCM (same encryption utility pattern as API)
- Worker POSTs Slack Block Kit JSON with game image, price, discount, buy link
- On 4xx from Slack, the webhook column is set to null and the email stub is called
- On 5xx or network error, the job retries up to 3 times with exponential backoff (BullMQ backoff config)
- Each notification attempt is logged to `alertNotifications` with `channel = 'slack'`
- The ingest worker enqueues a job to `slackNotificationQueue` when a price-drop or all-time-low event is detected for a user with a configured Slack webhook
- The new worker is closed in the graceful shutdown handler