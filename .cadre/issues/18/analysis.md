## Requirements

1. Implement `GET /api/user/me/wishlist` endpoint that returns the authenticated user's wishlist with current best prices per game, using pagination (`?page=1&limit=24`)
2. Implement `POST /api/user/me/wishlist` endpoint that adds a game to the authenticated user's wishlist (accepts a `gameId` in the body)
3. Implement `DELETE /api/user/me/wishlist/:gameId` endpoint that removes a game from the authenticated user's wishlist
4. Implement `GET /api/user/me/wishlist/deals` endpoint that filters the user's wishlist to only games currently on sale (at least one store listing with an active discount)
5. All four endpoints require JWT authentication via the existing `authMiddleware`
6. `GET /wishlist` must join across `store_listings` and `price_history` to attach the current best price (lowest `currentPriceCents`) per game, including `storeName`, `storeLogoUrl`, `currentPriceCents`, `originalPriceCents`, `discountPercent`, and `buyUrl`
7. Include a `source` field on each wishlist item that distinguishes between `manual` and `steam_sync` additions — this requires adding a `source` column to the `wishlists` database table
8. When a game is added via POST, the response should indicate whether the user already has a price alert for that game (to support a frontend prompt)
9. Apply pagination to all list endpoints using `page` and `limit` query parameters (default `limit=24`)
10. Add unit and integration tests for all wishlist endpoints

## Change Type

feature

## Scope Estimate

medium

## Affected Areas

- `packages/db/src/schema.ts` — Add `source` column (with default `"manual"`) and a unique constraint on `(userId, gameId)` to the `wishlists` table
- `packages/api/src/routes/` — New `wishlist.ts` route file implementing all four endpoints
- `packages/api/src/lib/validation.ts` — New Zod schemas for wishlist request/query validation (e.g., `addToWishlistSchema`, wishlist pagination schema with `limit` default of 24)
- `packages/api/src/index.ts` — Mount the wishlist routes under the authenticated user path (e.g., `/api/v1/user/me/wishlist`)
- `packages/api/src/middleware/auth.ts` — Already exists and will be reused; no changes expected
- `packages/api/tests/routes/` — New `wishlist.test.ts` test file
- `packages/db/` — Potential migration needed for the new `source` column and unique constraint

## Ambiguities

1. The issue references `store_listing.is_on_sale = true` for the deals filter, but the `store_listings` schema has no `is_on_sale` column. "On sale" must be inferred — likely by checking if the latest `price_history` row has a non-null `discount` greater than zero, or by comparing `price` to `originalPrice`.
2. The response shape includes `allStorePrices: [...]` but the issue does not define the structure of individual items in this array. It's unclear whether every store listing with a price should be included or only active ones.
3. The existing API routes are mounted under `/api/v1/...` (e.g., `/api/v1/games`, `/api/v1/deals`), but the issue specifies paths like `/api/user/me/wishlist` without the `v1` prefix. It needs to be determined whether wishlist routes should follow the existing `/api/v1/user/me/wishlist` convention.
4. The `bestPrice.buyUrl` includes an affiliate parameter (`?pp=<affiliate>`). The `stores` table has a `referral_param` column, but it's unclear how it should be appended to `storeUrl` to construct the final `buyUrl`.
5. The issue mentions that when a game is added, the API "should support" checking for an existing price alert and optionally prompting — but the exact API contract (response field name, shape) for this is unspecified.
6. The `wishlists` table currently lacks a unique constraint on `(userId, gameId)`, so duplicate entries are possible. A unique constraint should be added but this is not explicitly stated.

```cadre-json
{
  "requirements": [
    "Implement GET /api/user/me/wishlist endpoint returning the authenticated user's wishlist with current best prices per game, paginated with ?page=1&limit=24",
    "Implement POST /api/user/me/wishlist endpoint to add a game to the authenticated user's wishlist",
    "Implement DELETE /api/user/me/wishlist/:gameId endpoint to remove a game from the authenticated user's wishlist",
    "Implement GET /api/user/me/wishlist/deals endpoint filtering the wishlist to only games currently on sale",
    "All endpoints require JWT authentication via existing authMiddleware",
    "GET /wishlist must join store_listings and price_history to attach the current best price per game with storeName, storeLogoUrl, currentPriceCents, originalPriceCents, discountPercent, and buyUrl",
    "Add a source column to the wishlists table distinguishing between manual and steam_sync additions",
    "POST response should indicate whether the user already has a price alert for the added game",
    "Apply pagination to list endpoints with default limit of 24",
    "Add unit and integration tests for all wishlist endpoints"
  ],
  "changeType": "feature",
  "scope": "medium",
  "affectedAreas": [
    "packages/db/src/schema.ts",
    "packages/api/src/routes/",
    "packages/api/src/lib/validation.ts",
    "packages/api/src/index.ts",
    "packages/api/tests/routes/"
  ],
  "ambiguities": [
    "The issue references store_listing.is_on_sale = true but this column does not exist in the schema; on-sale must be inferred from price_history discount or price vs originalPrice",
    "The allStorePrices array in the response shape is not fully defined — item structure and inclusion criteria are unclear",
    "Existing routes use /api/v1/ prefix but issue specifies /api/user/me/wishlist without v1 — routing convention needs clarification",
    "Construction of bestPrice.buyUrl with affiliate parameter from stores.referral_param is not specified",
    "The API contract for indicating an existing price alert when adding a game (response field name/shape) is unspecified",
    "The wishlists table lacks a unique constraint on (userId, gameId) — adding one is implied but not explicitly stated"
  ]
}
```
