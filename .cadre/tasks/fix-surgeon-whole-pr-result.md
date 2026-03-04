# Fix Summary

## Issues Addressed
- `packages/worker/src/index.ts` (line 428): imageUrl was hardcoded to empty string. Fixed by querying all store listings for the game in `processNotification`, passing `game.headerImageUrl` through the email queue job data, and using it in the email worker's `PriceAlertData`.
- `packages/worker/src/index.ts` (line 429): Each email only included the single triggering store listing's price. Fixed by querying all store listings for the game along with their latest prices in `processNotification`, passing the full set as `allListings` through the email queue, and building a complete cross-store price comparison in the email worker.

## Files Modified
- packages/worker/src/index.ts
- packages/worker/tests/index.test.ts

## Files Created
- (none)

## Notes
- The `processNotification` function now queries all store listings for the game (instead of just the triggering one) and fetches each listing's latest price and store slug.
- The email queue job data shape changed: `storeUrl`/`storeSlug` replaced by `imageUrl` and `allListings` array.
- Tests updated to reflect the new data flow and verify imageUrl forwarding and multi-store price entries.
