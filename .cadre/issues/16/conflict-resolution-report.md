# Conflict Resolution Report

## Summary
Resolved 1 conflicted file while rebasing issue #16 onto main.

## What the Base Branch Introduced
The main branch merged issue #15 (auth infrastructure), which added `users` and `refreshTokens` table stubs and mocks for `bcryptjs` and `jsonwebtoken` to the test file.

## Files Resolved

### `packages/api/tests/index.test.ts`
- **Conflict regions**: 1
- **Resolution**: Both sides added independent table stubs to the `@taad/db` mock — HEAD added `searchAnalytics` (issue-16 search feature), base added `users` and `refreshTokens` (issue-15 auth). Kept all three table stubs and the base branch's `bcryptjs`/`jsonwebtoken` mocks, since both features are needed.

## Notes
- No trade-offs or ambiguity — the additions are fully independent.
