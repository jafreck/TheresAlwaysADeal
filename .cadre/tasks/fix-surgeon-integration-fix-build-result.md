# Fix Summary

## Issues Addressed
- `packages/worker/src/index.ts` (lines 5-16): Resolved merge conflict markers in imports by combining both HEAD (email features: `gte`, `priceAlerts`, `buildReferralUrl`, `sendPriceAlert`, `emailQueue`) and origin/main (steam sync features: `isNotNull`, `wishlists`, `steamSyncQueue`) imports
- `packages/worker/src/index.ts` (lines 622-628): Resolved merge conflict markers in graceful shutdown by keeping all worker close calls (`priceDropWorker`, `allTimeLowWorker`, `emailWorker`, `steamSyncWorker`)
- `packages/worker/src/queues.ts` (lines 24-30): Resolved merge conflict markers by keeping both `emailQueue` and `steamSyncQueue` definitions
- `packages/worker/src/queues.ts` (lines 36-40): Resolved merge conflict markers by keeping both `emailQueueEvents` and `steamSyncQueueEvents` definitions

## Files Modified
- packages/worker/src/index.ts
- packages/worker/src/queues.ts

## Files Created
- (none)

## Notes
- Both sides of each conflict were independent features (email integration vs steam sync) that coexist without overlap
- The `@taad/worker` build now succeeds; a pre-existing `@taad/web` build failure (missing `@hookform/resolvers/zod`) is unrelated
