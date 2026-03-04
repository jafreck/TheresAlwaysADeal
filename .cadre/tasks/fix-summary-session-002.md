# Fix Summary

## Issues Addressed
- `packages/worker/src/index.ts` (line 377): Added NOTE comment documenting that `notifySlackWebhook` is encrypted at rest and the notification consumer must decrypt it (price-drop worker)
- `packages/worker/src/index.ts` (line 424): Added same NOTE comment for the all-time-low alert worker
- `packages/api/src/routes/alerts.ts` (line 65): Wrapped the active alert count check and insert in a `db.transaction()` call to eliminate the TOCTOU race condition that could allow exceeding the 100-alert cap
- `packages/worker/src/index.ts` (line 407): Moved the store listing query outside the `for (const alert of activeAlerts)` loop to eliminate the N+1 query pattern, since `storeListingId` is constant across all iterations

## Files Modified
- packages/worker/src/index.ts
- packages/api/src/routes/alerts.ts
- packages/api/tests/routes/alerts.test.ts

## Files Created
- (none)

## Notes
- The encrypted webhook issue (issues 1 & 2) is documented with NOTE comments rather than decrypting in the worker, because the `decrypt` function lives in `packages/api` and moving it to a shared package would be a larger refactor outside the scope of this fix. The notification consumer (issues #20/#21) must handle decryption.
- The test mock for `db` was updated to include a `transaction` method that delegates to the same mock, matching drizzle-orm's transaction API.
