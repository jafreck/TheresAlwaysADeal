# Fix Summary

## Issues Addressed
- `packages/web/src/lib/api-client.ts` (line 60): Added `sort?: string` to `SearchGamesParams` interface so TypeScript accepts the sort parameter.
- `packages/web/src/app/search/page.tsx` (line 68): Added `sort: filters.sort || undefined` to the `apiClient.searchGames()` call so the sort selection is actually sent to the API.

## Files Modified
- packages/web/src/lib/api-client.ts
- packages/web/src/app/search/page.tsx

## Files Created
- (none)

## Notes
- Build passes successfully. All search-related tests pass.
- Two pre-existing test timeouts in `packages/api/tests/lib/password.test.ts` are unrelated to these changes.
