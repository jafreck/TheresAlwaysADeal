# Task Result: session-003 - Worker Alert Evaluation Logic

## Changes Made
- `packages/worker/src/queues.ts`: Added `notificationQueue` (BullMQ Queue named 'notification') and `notificationQueueEvents` (corresponding QueueEvents) exports
- `packages/worker/src/index.ts`: Added `priceDropAlertWorker` consuming 'price-drop' queue — queries active priceAlerts for the gameId, filters by storeId if scoped, triggers when current price ≤ targetPrice or discount ≥ targetDiscountPercent, enqueues notification job and inserts alertNotifications row
- `packages/worker/src/index.ts`: Added `allTimeLowAlertWorker` consuming 'all-time-low' queue — queries active priceAlerts for the gameId, triggers all unconditionally (with store-scope filtering), enqueues notification job and inserts alertNotifications row
- `packages/worker/src/index.ts`: Imported `notificationQueue` from './queues.js' and `priceAlerts`/`alertNotifications` from '@taad/db'
- `packages/worker/src/index.ts`: Added both new workers to the graceful shutdown handler

## Files Modified
- packages/worker/src/queues.ts
- packages/worker/src/index.ts

## Files Created
- (none)

## Notes
- Price-drop alerts remain active (isActive is not set to false) so re-notification occurs on further drops
- All-time-low alerts also remain active for re-notification
- Store-scoped alerts (with a non-null storeId) only trigger for price events on matching store listings
- The discount percent for price-drop evaluation is read from the latest priceHistory record for the store listing
- The worker package builds successfully with no TypeScript errors
