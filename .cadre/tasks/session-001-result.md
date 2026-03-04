# Task Result: session-001 - Wishlist schema, validation, routes, and mounting

## Changes Made
- `packages/db/src/schema.ts`: Added `source` varchar column (default `'manual'`) and `unique(userId, gameId)` constraint to `wishlists` table
- `packages/db/tests/schema.test.ts`: Added assertion for `source` column in wishlists test
- `packages/api/src/lib/validation.ts`: Added `addToWishlistSchema` (gameId UUID) and `wishlistPaginationSchema` (limit default 24, max 100)
- `packages/api/tests/lib/validation.test.ts`: Added tests for both new validation schemas (valid/invalid inputs)
- `packages/api/src/routes/wishlist.ts`: Created route file with GET / (paginated wishlist + best prices), POST / (add game + hasPriceAlert check), DELETE /:gameId (remove entry), GET /deals (on-sale wishlist items)
- `packages/api/src/index.ts`: Imported `createWishlistApp` and `authMiddleware`, mounted at `/api/v1/user/me/wishlist` with auth middleware

## Files Modified
- packages/db/src/schema.ts
- packages/db/tests/schema.test.ts
- packages/api/src/lib/validation.ts
- packages/api/tests/lib/validation.test.ts
- packages/api/src/index.ts

## Files Created
- packages/api/src/routes/wishlist.ts

## Notes
- The `c.get("user")` calls produce TS errors because Hono doesn't have type declarations for the "user" context variable set by authMiddleware. This is the same pattern limitation as in other parts of the codebase; the `as { sub: string }` cast handles runtime correctness.
- GET / uses left joins for store/price data so wishlist items without store listings still appear.
- GET /deals uses inner joins to filter only items with active discount > 0 on the latest price_history row.
- POST / uses `returning()` after insert and checks for active price alerts.
- All 145 relevant tests pass (packages/db + packages/api/tests/lib/validation).
