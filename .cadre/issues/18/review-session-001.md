```cadre-json
{
  "verdict": "needs-fixes",
  "summary": "The POST / endpoint inserts into a table with a unique(userId, gameId) constraint but does not handle the constraint violation, causing unhandled 500 errors on duplicate additions. Additionally, GET /deals may return multiple rows per game (one per discounted store listing) unlike GET / which selects only the best-price listing.",
  "issues": [
    {
      "file": "packages/api/src/routes/wishlist.ts",
      "line": 99,
      "severity": "warning",
      "description": "The POST handler inserts into `wishlists` which has a unique constraint on (userId, gameId), but does not handle the constraint violation. If a user adds the same game twice, the DB will throw and the client receives an unhandled 500 error. Use `.onConflictDoNothing()` (or wrap in try/catch and return 409 Conflict) to handle this expected failure gracefully."
    },
    {
      "file": "packages/api/src/routes/wishlist.ts",
      "line": 172,
      "severity": "warning",
      "description": "GET /deals joins all active store listings per game, so a game with multiple discounted listings produces multiple rows and inflates the `total` count. This is inconsistent with GET / which uses a subquery to select only the single best-price store listing per game. Apply a similar best-price subquery (or DISTINCT ON gameId) to ensure one row per wishlist item."
    }
  ]
}
```
