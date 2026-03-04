# Task Result: session-001 - API helpers, useDebounce hook, and nuqs dependency

## Changes Made
- `packages/web/package.json`: Added `nuqs` (^2.0.0) to dependencies
- `packages/web/src/lib/useDebounce.ts`: Created generic `useDebounce<T>` hook with configurable delay (default 200ms)
- `packages/web/src/lib/api-client.ts`: Added `searchGames` and `autocomplete` methods to `apiClient`, plus exported interfaces (`SearchGamesParams`, `AutocompleteParams`, `AutocompleteItem`, `AutocompleteResponse`) and a `buildQuery` helper

## Files Modified
- packages/web/package.json
- packages/web/src/lib/api-client.ts

## Files Created
- packages/web/src/lib/useDebounce.ts

## Notes
- `searchGames` calls `GET /api/v1/games/search` with params `{ q, page?, limit?, store?, genre?, min_discount?, max_price? }` matching the backend `searchQuerySchema`
- `autocomplete` calls `GET /api/v1/games/autocomplete` with params `{ q, limit? }` matching the backend `autocompleteQuerySchema`
- Both methods reuse the existing `request` function for auth headers and error handling
- All 179 existing tests pass after changes
- TypeScript type-check passes cleanly
