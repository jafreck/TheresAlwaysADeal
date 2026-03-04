# Conflict Resolution Report

## Summary
Resolved 7 conflicted file(s) while rebasing issue #20 onto main.

## What the Base Branch Introduced
The HEAD side (earlier commits on this branch) added **Steam account linking and wishlist sync** features: Steam OpenID auth routes, user routes, Steam validation schemas, a `steam-sync` BullMQ queue/worker, and corresponding tests. The incoming commit (`cd38ce5`) from this same branch added **email price alert notification** features: an `email` BullMQ queue/worker, price-drop and all-time-low notification processors, an unsubscribe schema, alerts routes, and the `@taad/email` package integration.

Both sides are additive and independent — they do not modify the same logic for different reasons. The resolution keeps all additions from both sides.

## Files Resolved

### `packages/api/src/index.ts`
- **Conflict regions**: 2
- **Resolution**: Kept both import blocks (Steam routes + alerts route) and both route mount blocks. No adaptation needed — they mount on different URL paths (`/auth/steam`, `/user`, `/alerts`).

### `packages/api/src/lib/validation.ts`
- **Conflict regions**: 1
- **Resolution**: Kept both schema sections: Steam schemas (`steamCallbackSchema`, `steamUnlinkSchema`) and the unsubscribe schema (`unsubscribeSchema`). They define entirely separate validation objects.

### `packages/api/tests/lib/validation.test.ts`
- **Conflict regions**: 2
- **Resolution**: Kept both import additions (`steamCallbackSchema`, `steamUnlinkSchema`, `unsubscribeSchema`) and both test `describe` blocks (Steam schemas tests + unsubscribe schema tests).

### `packages/worker/src/index.ts`
- **Conflict regions**: 2
- **Resolution**:
  - **Imports**: Merged drizzle-orm imports (`isNotNull` + `gte`), `@taad/db` imports (`users`, `wishlists` + `priceAlerts`), `@taad/scraper` imports (`buildReferralUrl`), added `@taad/email` import, and merged queue imports (`steamSyncQueue` + `emailQueue`).
  - **Graceful shutdown**: Kept all worker `.close()` calls: `steamSyncWorker`, `priceDropWorker`, `allTimeLowWorker`, and `emailWorker`.

### `packages/worker/src/queues.ts`
- **Conflict regions**: 2
- **Resolution**: Kept both queue definitions (`steamSyncQueue` + `emailQueue`) and both QueueEvents (`steamSyncQueueEvents` + `emailQueueEvents`).

### `packages/worker/tests/index.test.ts`
- **Conflict regions**: 3
- **Resolution**:
  - **Mock `@taad/db`**: Merged mock column definitions — `storeListingStats` gets `allTimeLowPrice` from base, `users` mock gets both `steamId` (HEAD) and `email` (base), added `priceAlerts` and `wishlists` mocks.
  - **Mock `drizzle-orm`**: Kept both `isNotNull` and `gte` mock functions.
  - **Test blocks**: Kept all Steam sync worker tests (HEAD) and all notification/email worker tests (base). Added `"steam-sync"` to the graceful shutdown worker name assertions.

### `packages/worker/tests/queues.test.ts`
- **Conflict regions**: 3
- **Resolution**: Kept both test cases for Queue creation, QueueEvents creation, and exports — `steamSyncQueue`/`steamSyncQueueEvents` alongside `emailQueue`/`emailQueueEvents`.

## Notes
- The single failing test (`packages/web/tests/lib/useAuth.test.ts`) is a pre-existing failure unrelated to any conflicted file.
- Build passes cleanly across all 6 packages.
- All 1127 tests in conflicted packages pass; 1 pre-existing failure in `@taad/web`.
