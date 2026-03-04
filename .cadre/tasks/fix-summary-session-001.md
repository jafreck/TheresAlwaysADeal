# Fix Summary

## Issues Addressed
- `packages/api/src/routes/wishlist.ts` (line 99): POST / handler now uses `.onConflictDoNothing()` on the insert and returns 409 Conflict when a duplicate (userId, gameId) entry is detected, instead of letting the DB throw an unhandled 500 error.
- `packages/api/src/routes/wishlist.ts` (line 172): GET /deals now uses the same best-price subquery as GET / to select only the single cheapest active store listing per game, preventing duplicate rows when a game has multiple discounted store listings. The `total` count and data query both use the same filtered join.

## Files Modified
- packages/api/src/routes/wishlist.ts
- packages/api/tests/routes/wishlist.test.ts

## Files Created
- (none)

## Notes
- The test mock's `createInsertBuilder` was updated to include `onConflictDoNothing()` in the chain, matching the new production code.
- The best-price subquery in GET /deals mirrors the existing pattern in GET / (lines 62–70) for consistency.
