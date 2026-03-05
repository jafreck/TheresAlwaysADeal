# Session: session-001 - API helpers, useDebounce hook, and nuqs dependency

**Rationale:** The API client methods and useDebounce hook are foundational — every other session depends on them being in place first.
**Dependencies:** none

## Steps

### session-001-step-001: Install nuqs dependency
**Description:** Add the `nuqs` package to `packages/web/package.json` for type-safe URL search parameter state management used by the search page filters.
**Files:** packages/web/package.json
**Complexity:** simple
**Acceptance Criteria:**
- `nuqs` is listed in `dependencies` in `packages/web/package.json`
- `pnpm install` completes without errors

### session-001-step-002: Add useDebounce hook
**Description:** Create a `useDebounce` custom hook in `packages/web/src/lib/useDebounce.ts` that returns a debounced value after a configurable delay (default 200ms). This is used by the autocomplete search bar.
**Files:** packages/web/src/lib/useDebounce.ts
**Complexity:** simple
**Acceptance Criteria:**
- `useDebounce` is exported from `packages/web/src/lib/useDebounce.ts`
- Accepts a generic value `T` and a `delay` number parameter (default 200)
- Returns the debounced value that updates only after the delay elapses

### session-001-step-003: Add search and autocomplete API client methods
**Description:** Add `searchGames` and `autocomplete` helper functions to `packages/web/src/lib/api-client.ts`. `searchGames` calls `GET /api/v1/games/search` with query, pagination, and filter params, returning `EnvelopeResponse`. `autocomplete` calls `GET /api/v1/games/autocomplete` returning `{ data: Array<{ title, slug }> }`.
**Files:** packages/web/src/lib/api-client.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `apiClient.searchGames` is exported and accepts `{ q, page?, limit?, store?, genre?, min_discount?, max_price? }`
- `apiClient.autocomplete` is exported and accepts `{ q, limit? }`
- `searchGames` constructs query string from params and calls `GET /api/v1/games/search?...`
- `autocomplete` constructs query string and calls `GET /api/v1/games/autocomplete?q=...&limit=...`
- Both methods use the existing `request` function (inheriting auth headers and error handling)
- TypeScript interfaces for search result and autocomplete result are exported