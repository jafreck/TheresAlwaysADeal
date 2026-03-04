# Session: session-001 - Wishlist schema, validation, routes, and mounting

**Rationale:** All changes form a tight dependency chain: schema column → validation schemas → route handlers → app mounting. The agent benefits from seeing each step's output before the next.
**Dependencies:** none

## Steps

### session-001-step-001: Add source column and unique constraint to wishlists table
**Description:** Add a `source` varchar column (default 'manual') and a unique constraint on `(userId, gameId)` to the `wishlists` table in `packages/db/src/schema.ts`. Update the schema test to assert the new column.
**Files:** packages/db/src/schema.ts, packages/db/tests/schema.test.ts
**Complexity:** simple
**Acceptance Criteria:**
- `wishlists` table has a `source` column of type varchar with default value `'manual'`
- `wishlists` table has a unique constraint on `(userId, gameId)`
- Schema test asserts `source` is present in the wishlists columns

### session-001-step-002: Add wishlist validation schemas
**Description:** Add `addToWishlistSchema` (requires `gameId` as UUID string) and `wishlistPaginationSchema` (extends paginationSchema with default limit of 24) to `packages/api/src/lib/validation.ts`.
**Files:** packages/api/src/lib/validation.ts, packages/api/tests/lib/validation.test.ts
**Complexity:** simple
**Acceptance Criteria:**
- `addToWishlistSchema` is exported and requires a `gameId` field that must be a valid UUID string
- `wishlistPaginationSchema` is exported with `page` default 1 and `limit` default 24 (max 100)
- Validation tests cover valid and invalid inputs for both schemas

### session-001-step-003: Implement wishlist route handlers
**Description:** Create `packages/api/src/routes/wishlist.ts` exporting a `createWishlistApp` factory function with four endpoints: GET / (paginated wishlist with best prices), POST / (add game, check price alert), DELETE /:gameId (remove game), GET /deals (on-sale wishlist items). All endpoints require the authenticated user's ID from context. Follow the patterns in deals.ts for joins and pagination.
**Files:** packages/api/src/routes/wishlist.ts
**Complexity:** complex
**Acceptance Criteria:**
- GET / returns paginated wishlist items with game info and best price (storeName, storeLogoUrl, currentPriceCents, originalPriceCents, discountPercent, buyUrl) using `buildEnvelopeResponse`
- POST / inserts a wishlist entry with source='manual', returns the entry and a `hasPriceAlert` boolean indicating whether an active price alert exists for the user+game
- DELETE /:gameId deletes the wishlist entry for the authenticated user and game, returns 204 on success and 404 if not found
- GET /deals returns only wishlist items where the latest price_history row has a non-null discount > 0, paginated with `buildEnvelopeResponse`
- All endpoints read the authenticated user ID from `c.get('user')` context set by authMiddleware
- Invalid input returns 400 with error details from Zod validation

### session-001-step-004: Mount wishlist routes in the API app
**Description:** Import `createWishlistApp` and `authMiddleware` in `packages/api/src/index.ts`, create a sub-router that applies `authMiddleware`, and mount the wishlist app at `/user/me/wishlist` on the v1 router.
**Files:** packages/api/src/index.ts
**Complexity:** simple
**Acceptance Criteria:**
- Wishlist routes are accessible at `/api/v1/user/me/wishlist`
- `authMiddleware` is applied to all wishlist routes
- Existing routes are not affected