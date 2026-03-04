# Fix Summary

## Issues Addressed
- `packages/api/src/routes/auth.ts` (line 88): Race condition in POST /register — replaced SELECT-then-INSERT pattern with a single INSERT using `.onConflictDoNothing()`. If the insert returns no rows (email conflict), returns 400 "Email already registered". This eliminates the window where concurrent duplicate registrations could cause an unhandled unique-constraint violation.
- `packages/api/src/routes/wishlist.ts` (line 99): Missing game existence check in POST / — added a SELECT query to verify the gameId references an existing game before inserting into wishlists. Returns 404 "Game not found" if the game doesn't exist, preventing an unhandled foreign-key violation from surfacing as a 500.

## Files Modified
- packages/api/src/routes/auth.ts
- packages/api/src/routes/wishlist.ts
- packages/api/tests/routes/auth.test.ts
- packages/api/tests/routes/wishlist.test.ts

## Files Created
- (none)

## Notes
- Auth tests updated to reflect the new onConflictDoNothing insert chain and changed error message for insert failures.
- Wishlist tests updated to mock the new game-existence SELECT call before the insert.
- All 613 tests pass. Build succeeds. Pre-existing lint failures in @taad/web and @taad/db are unrelated.
