# Implementation Plan — Wishlist API Endpoints (Issue #18)

## Overview

This plan implements the four wishlist endpoints (`GET`, `POST`, `DELETE`, `GET /deals`) behind JWT auth, adds a `source` column and unique constraint to the `wishlists` table, adds validation schemas, and mounts the routes on the existing `/api/v1` router.

## Sessions

### Session 1: Schema update + validation schemas + wishlist route + app mounting

All changes are tightly coupled: the schema column is consumed by the route, the validation schemas are consumed by the route, and the route must be mounted in `index.ts`. Grouping in a single session lets the agent see each prior step's output.

---

```cadre-json
[
  {
    "id": "session-001",
    "name": "Wishlist schema, validation, routes, and mounting",
    "rationale": "All changes form a tight dependency chain: schema column → validation schemas → route handlers → app mounting. The agent benefits from seeing each step's output before the next.",
    "dependencies": [],
    "steps": [
      {
        "id": "session-001-step-001",
        "name": "Add source column and unique constraint to wishlists table",
        "description": "Add a `source` varchar column (default 'manual') and a unique constraint on `(userId, gameId)` to the `wishlists` table in `packages/db/src/schema.ts`. Update the schema test to assert the new column.",
        "files": ["packages/db/src/schema.ts", "packages/db/tests/schema.test.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`wishlists` table has a `source` column of type varchar with default value `'manual'`",
          "`wishlists` table has a unique constraint on `(userId, gameId)`",
          "Schema test asserts `source` is present in the wishlists columns"
        ]
      },
      {
        "id": "session-001-step-002",
        "name": "Add wishlist validation schemas",
        "description": "Add `addToWishlistSchema` (requires `gameId` as UUID string) and `wishlistPaginationSchema` (extends paginationSchema with default limit of 24) to `packages/api/src/lib/validation.ts`.",
        "files": ["packages/api/src/lib/validation.ts", "packages/api/tests/lib/validation.test.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`addToWishlistSchema` is exported and requires a `gameId` field that must be a valid UUID string",
          "`wishlistPaginationSchema` is exported with `page` default 1 and `limit` default 24 (max 100)",
          "Validation tests cover valid and invalid inputs for both schemas"
        ]
      },
      {
        "id": "session-001-step-003",
        "name": "Implement wishlist route handlers",
        "description": "Create `packages/api/src/routes/wishlist.ts` exporting a `createWishlistApp` factory function with four endpoints: GET / (paginated wishlist with best prices), POST / (add game, check price alert), DELETE /:gameId (remove game), GET /deals (on-sale wishlist items). All endpoints require the authenticated user's ID from context. Follow the patterns in deals.ts for joins and pagination.",
        "files": ["packages/api/src/routes/wishlist.ts"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "GET / returns paginated wishlist items with game info and best price (storeName, storeLogoUrl, currentPriceCents, originalPriceCents, discountPercent, buyUrl) using `buildEnvelopeResponse`",
          "POST / inserts a wishlist entry with source='manual', returns the entry and a `hasPriceAlert` boolean indicating whether an active price alert exists for the user+game",
          "DELETE /:gameId deletes the wishlist entry for the authenticated user and game, returns 204 on success and 404 if not found",
          "GET /deals returns only wishlist items where the latest price_history row has a non-null discount > 0, paginated with `buildEnvelopeResponse`",
          "All endpoints read the authenticated user ID from `c.get('user')` context set by authMiddleware",
          "Invalid input returns 400 with error details from Zod validation"
        ]
      },
      {
        "id": "session-001-step-004",
        "name": "Mount wishlist routes in the API app",
        "description": "Import `createWishlistApp` and `authMiddleware` in `packages/api/src/index.ts`, create a sub-router that applies `authMiddleware`, and mount the wishlist app at `/user/me/wishlist` on the v1 router.",
        "files": ["packages/api/src/index.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "Wishlist routes are accessible at `/api/v1/user/me/wishlist`",
          "`authMiddleware` is applied to all wishlist routes",
          "Existing routes are not affected"
        ]
      }
    ]
  }
]
```
