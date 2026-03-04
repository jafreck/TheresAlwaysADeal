# Conflict Resolution Report

## Summary
Resolved 1 conflicted file while rebasing issue #19 onto main.

## What the Base Branch Introduced
The base branch (main) merged issue #15 (User Authentication), which added `users` and `refreshTokens` table stubs to the mock, plus mocks for `bcryptjs` and `jsonwebtoken` auth utilities.

## Files Resolved

### `packages/api/tests/index.test.ts`
- **Conflict regions**: 1
- **Resolution**: Both sides added independent table stubs to the `@taad/db` mock — HEAD added `searchAnalytics` (for issue #19 search/watchlist features), while the base branch added `users` and `refreshTokens` plus `bcryptjs`/`jsonwebtoken` mocks (for auth). Kept all additions from both sides since they are non-overlapping. The `searchAnalytics` stub was placed before the auth stubs, maintaining the original ordering from each branch.

## Notes
- Straightforward additive conflict — no semantic overlap between the two sides.
- All 23 tests pass after resolution.
