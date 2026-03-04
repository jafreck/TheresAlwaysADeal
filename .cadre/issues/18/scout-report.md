# Scout Report

## Relevant Files

| File | Reason |
|------|--------|
| `packages/db/src/schema.ts` | Contains the `wishlists` table definition; needs `source` column and `unique(userId, gameId)` constraint added |
| `packages/api/src/routes/wishlist.ts` | New file — implements GET /wishlist, POST /wishlist, DELETE /wishlist/:gameId, GET /wishlist/deals endpoints |
| `packages/api/src/lib/validation.ts` | Needs new Zod schemas for wishlist requests (addToWishlistSchema, wishlist pagination with limit=24 default) |
| `packages/api/src/index.ts` | Must mount the new wishlist route under `/api/v1/user/me/wishlist` with authMiddleware |
| `packages/api/src/lib/response.ts` | Provides `buildEnvelopeResponse` utility used by all paginated endpoints; will be reused, no changes needed |
| `packages/api/src/middleware/auth.ts` | Provides `authMiddleware` for JWT authentication; will be reused, no changes expected |
| `packages/api/src/lib/jwt.ts` | Provides `verifyAccessToken` used by authMiddleware; read-only dependency |
| `packages/db/src/index.ts` | Re-exports all schema tables via `export * from "./schema.js"`; already exports `wishlists` and `priceAlerts`, no changes needed |
| `packages/api/src/routes/deals.ts` | Reference implementation showing how to join storeListings, priceHistory, stores with pagination; pattern to follow |

## Dependency Map

- `packages/api/src/routes/wishlist.ts` (new) will import:
  - `@taad/db` — for `db`, `wishlists`, `games`, `storeListings`, `stores`, `priceHistory`, `priceAlerts`
  - `../lib/validation.js` — for new wishlist validation schemas
  - `../lib/response.js` — for `buildEnvelopeResponse`
- `packages/api/src/index.ts` will import:
  - `./routes/wishlist.js` — new wishlist app factory
  - `./middleware/auth.js` — existing `authMiddleware` (already available in scope)
- `packages/api/src/lib/validation.ts` — standalone, uses `zod` only
- `packages/db/src/schema.ts` — standalone, uses `drizzle-orm/pg-core` only
- `packages/db/src/index.ts` re-exports everything from `schema.ts`; any new columns on `wishlists` are automatically available to consumers
- `packages/api/src/middleware/auth.ts` imports `../lib/jwt.js` → `verifyAccessToken`
- `packages/api/src/routes/deals.ts` — read-only reference; imports `@taad/db`, `../lib/validation.js`, `../lib/response.js`

## Test Files

- `packages/db/tests/schema.test.ts` — covers `wishlists` table columns (lines 159-175); will need update to assert new `source` column
- `packages/api/tests/middleware/auth.test.ts` — covers `authMiddleware` (complete coverage); no changes needed
- `packages/api/tests/lib/validation.test.ts` — covers existing validation schemas; will need new tests for wishlist schemas
- `packages/api/tests/routes/deals.test.ts` — covers deals routes with mock patterns; serves as template for wishlist tests
- `packages/api/tests/routes/auth.test.ts` — covers auth routes with DB/JWT mocking patterns; serves as template
- `packages/api/tests/routes/wishlist.test.ts` — **does not exist yet**; must be created with unit/integration tests for all four wishlist endpoints
- `packages/api/tests/index.test.ts` — covers the main app setup; may need update if route mounting changes are tested there

## Estimated Change Surface

5 files require changes, plus 1 new route file and 1 new test file. `packages/api/src/routes/wishlist.ts` is the most complex (new file, ~150-200 lines, joins across wishlists/storeListings/priceHistory/stores/priceAlerts with pagination). `packages/db/src/schema.ts` is a small additive change (~5 lines for source column + unique constraint). `packages/api/src/lib/validation.ts` needs ~10-15 lines for new schemas. `packages/api/src/index.ts` needs ~5 lines for route mounting. `packages/db/tests/schema.test.ts` needs ~2 lines for the new column assertion. Risk areas: the complex join query in the wishlist GET endpoint mirrors the pattern in `deals.ts` but adds wishlist filtering; the unique constraint on wishlists may require a DB migration file.

```cadre-json
{
  "relevantFiles": [
    { "path": "packages/db/src/schema.ts", "reason": "Contains wishlists table; needs source column (varchar, default 'manual') and unique constraint on (userId, gameId)" },
    { "path": "packages/api/src/routes/wishlist.ts", "reason": "New file implementing GET /wishlist, POST /wishlist, DELETE /wishlist/:gameId, GET /wishlist/deals endpoints" },
    { "path": "packages/api/src/lib/validation.ts", "reason": "Needs new Zod schemas: addToWishlistSchema (gameId uuid), wishlist pagination schema (limit default 24)" },
    { "path": "packages/api/src/index.ts", "reason": "Must mount wishlist routes under /api/v1/user/me/wishlist with authMiddleware" },
    { "path": "packages/api/src/lib/response.ts", "reason": "Provides buildEnvelopeResponse used by wishlist list endpoints; no changes needed but is a key dependency" },
    { "path": "packages/api/src/middleware/auth.ts", "reason": "Provides authMiddleware for JWT auth on all wishlist endpoints; no changes needed but is a key dependency" },
    { "path": "packages/db/src/index.ts", "reason": "Re-exports all schema tables including wishlists and priceAlerts; no changes needed" },
    { "path": "packages/api/src/routes/deals.ts", "reason": "Reference implementation for storeListings/priceHistory join pattern with pagination; read-only reference" },
    { "path": "packages/db/tests/schema.test.ts", "reason": "Tests wishlists table columns; must be updated to assert new source column" },
    { "path": "packages/api/tests/lib/validation.test.ts", "reason": "Tests validation schemas; needs new tests for wishlist validation schemas" },
    { "path": "packages/api/tests/routes/wishlist.test.ts", "reason": "New test file for all wishlist endpoint unit/integration tests" }
  ],
  "dependencyMap": {
    "packages/api/src/routes/wishlist.ts": [
      "packages/db/src/schema.ts",
      "packages/db/src/index.ts",
      "packages/api/src/lib/validation.ts",
      "packages/api/src/lib/response.ts"
    ],
    "packages/api/src/index.ts": [
      "packages/api/src/routes/wishlist.ts",
      "packages/api/src/middleware/auth.ts",
      "packages/api/src/routes/games.ts",
      "packages/api/src/routes/deals.ts",
      "packages/api/src/routes/stores.ts",
      "packages/api/src/routes/auth.ts"
    ],
    "packages/api/src/lib/validation.ts": [],
    "packages/db/src/schema.ts": [],
    "packages/db/src/index.ts": ["packages/db/src/schema.ts"],
    "packages/api/src/middleware/auth.ts": ["packages/api/src/lib/jwt.ts"],
    "packages/api/src/lib/response.ts": [],
    "packages/api/src/routes/deals.ts": [
      "packages/db/src/index.ts",
      "packages/api/src/lib/validation.ts",
      "packages/api/src/lib/response.ts"
    ]
  },
  "testFiles": [
    "packages/db/tests/schema.test.ts",
    "packages/api/tests/middleware/auth.test.ts",
    "packages/api/tests/lib/validation.test.ts",
    "packages/api/tests/routes/deals.test.ts",
    "packages/api/tests/routes/auth.test.ts",
    "packages/api/tests/index.test.ts"
  ],
  "estimatedChanges": [
    { "path": "packages/db/src/schema.ts", "linesEstimate": 5 },
    { "path": "packages/api/src/routes/wishlist.ts", "linesEstimate": 180 },
    { "path": "packages/api/src/lib/validation.ts", "linesEstimate": 12 },
    { "path": "packages/api/src/index.ts", "linesEstimate": 8 },
    { "path": "packages/db/tests/schema.test.ts", "linesEstimate": 2 },
    { "path": "packages/api/tests/lib/validation.test.ts", "linesEstimate": 30 },
    { "path": "packages/api/tests/routes/wishlist.test.ts", "linesEstimate": 250 }
  ]
}
```
