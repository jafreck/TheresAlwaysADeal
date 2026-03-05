# Scout Report

## Relevant Files

| File | Reason |
|------|--------|
| `packages/web/src/components/Header.tsx` | Contains the search bar placeholder that must be upgraded to a functional autocomplete search bar with debounce, dropdown, and keyboard navigation |
| `packages/web/src/lib/api-client.ts` | API client that needs new `searchGames` and `autocomplete` helper methods for the search and autocomplete endpoints |
| `packages/web/src/components/GameCard.tsx` | Existing component to be reused in the search results grid; defines `GameCardProps` interface |
| `packages/web/src/app/layout.tsx` | Root layout with `QueryProvider` and metadata template (`%s | There's Always a Deal`) — search page metadata will use this template |
| `packages/web/src/lib/query-provider.tsx` | TanStack Query provider already configured — search queries will use this infrastructure |
| `packages/web/src/lib/utils.ts` | `cn()` utility used by all components for Tailwind class merging |
| `packages/web/src/components/EmptyState.tsx` | Reusable empty state component for no-results display on search page |
| `packages/web/src/components/ErrorState.tsx` | Reusable error state component with retry callback for search error handling |
| `packages/web/src/components/LoadingSpinner.tsx` | Loading indicator to use while search results are being fetched |
| `packages/web/src/components/DiscountBadge.tsx` | Used inside `GameCard`; discount filter chips will mirror these thresholds |
| `packages/web/src/components/PriceBadge.tsx` | Used inside `GameCard` for price display; autocomplete suggestions need similar price rendering |
| `packages/web/src/components/StoreIcon.tsx` | Used inside `GameCard` for store icon display |
| `packages/web/src/components/BuyButton.tsx` | Used inside `GameCard` for CTA |
| `packages/web/src/lib/auth-store.ts` | Imported by `api-client.ts` for auth token — no changes needed but is a dependency |
| `packages/web/src/app/globals.css` | Design tokens (colors, typography) — new filter/search components should use these semantic tokens |
| `packages/web/package.json` | May need `nuqs` dependency for URL search parameter state management |
| `packages/web/next.config.ts` | Image remote patterns — may need updates if autocomplete thumbnails come from new domains |
| `packages/api/src/routes/games.ts` | Backend search (`/search`) and autocomplete (`/autocomplete`) endpoints — defines response shapes the frontend must consume |
| `packages/api/src/lib/validation.ts` | `searchQuerySchema` and `autocompleteQuerySchema` define accepted query parameters |
| `packages/api/src/openapi.ts` | OpenAPI spec documents the API contract including `/games/search` and `/games/autocomplete` endpoints |
| `packages/api/src/lib/response.ts` | `buildEnvelopeResponse` defines the `EnvelopeResponse` shape the frontend `api-client.ts` already types |
| `packages/db/src/schema.ts` | Database schema — defines `games`, `genres`, `stores` tables; relevant for understanding available filter dimensions |

## Dependency Map

- `Header.tsx` → imports `useState` from React, `Link` from Next.js. Will need to import new `SearchBar`/`AutocompleteDropdown` components and `useRouter` from Next.js navigation.
- `GameCard.tsx` → imports `Image` (next/image), `cn` (utils), `PriceBadge`, `DiscountBadge`, `BuyButton`, `StoreIcon`. Search results grid will render arrays of `GameCard`.
- `api-client.ts` → imports `useAuthStore` from `auth-store.ts`. New search/autocomplete methods will be added here.
- `query-provider.tsx` → wraps the app with `QueryClientProvider` from TanStack Query. Search page hooks will rely on this.
- `layout.tsx` → imports `QueryProvider`, `Header`, `globals.css`. The new `/search` page will be a child of this layout.
- `EmptyState.tsx` → imports `cn` from utils. Will be used for no-results state on search page.
- `ErrorState.tsx` → imports `cn` from utils. Will be used for error state on search page.
- `LoadingSpinner.tsx` → imports `cn` from utils. Will be used for loading state.
- New `packages/web/src/app/search/page.tsx` → will import `GameCard`, `EmptyState`, `ErrorState`, `LoadingSpinner`, new filter components, and use TanStack Query hooks.
- New search/filter components → will import `cn` from utils, `apiClient` from api-client, TanStack Query hooks.
- `packages/api/src/routes/games.ts` → imports validation schemas from `validation.ts`, response builder from `response.ts`, cache middleware, and DB schema tables from `@taad/db`.

## Test Files

- `packages/web/tests/components/Header.test.tsx` — covers `Header.tsx` (thorough coverage of rendering, mobile menu toggle, accessibility). Will need updates/additions for autocomplete search bar behavior.
- `packages/web/tests/lib/api-client.test.ts` — covers `api-client.ts` (GET/POST/PUT/DELETE, auth headers, error handling). Will need new tests for search and autocomplete methods.
- `packages/web/tests/components/GameCard.test.tsx` — covers `GameCard.tsx` (complete coverage). No changes needed.
- `packages/web/tests/components/EmptyState.test.tsx` — covers `EmptyState.tsx`. No changes needed.
- `packages/web/tests/components/ErrorState.test.tsx` — covers `ErrorState.tsx`. No changes needed.
- `packages/web/tests/components/LoadingSpinner.test.tsx` — covers `LoadingSpinner.tsx`. No changes needed.
- `packages/web/tests/components/DiscountBadge.test.tsx` — covers `DiscountBadge.tsx`. No changes needed.
- `packages/web/tests/components/PriceBadge.test.tsx` — covers `PriceBadge.tsx`. No changes needed.
- `packages/web/tests/components/StoreIcon.test.tsx` — covers `StoreIcon.tsx`. No changes needed.
- `packages/web/tests/components/BuyButton.test.tsx` — covers `BuyButton.tsx`. No changes needed.
- `packages/web/tests/app/layout.test.tsx` — covers `layout.tsx`. No changes needed.
- `packages/web/tests/app/page.test.tsx` — covers home page. No changes needed.
- `packages/web/tests/lib/query-provider.test.tsx` — covers `QueryProvider`. No changes needed.
- `packages/api/tests/routes/games.test.ts` — covers API game routes including search and autocomplete. No changes needed (backend not changing).
- **Missing tests (gaps)**:
  - No tests for `packages/web/src/app/search/page.tsx` (new file)
  - No tests for new components: `SearchBar`, `AutocompleteDropdown`, `FiltersPanel`, `SearchResultsGrid`
  - No tests for new hooks: `useDebounce`, `useSearchFilters`, `useAutocomplete`

## Estimated Change Surface

This is a **large feature** affecting approximately 10–15 files. The primary changes are:

- **`packages/web/src/components/Header.tsx`** — Moderate complexity: replace the static search `<input>` with the new `SearchBar` component in both desktop and mobile views. The component's structure changes but core nav logic stays the same.
- **`packages/web/src/lib/api-client.ts`** — Low complexity: add 2 new API helper functions (`searchGames`, `autocomplete`) that call `GET /api/v1/games/search` and `GET /api/v1/games/autocomplete`.
- **`packages/web/src/app/search/page.tsx`** (new) — High complexity: new search results page with TanStack Query data fetching, URL parameter syncing, pagination/infinite scroll, dynamic metadata, filters panel integration.
- **New components** (~4–6 files: `SearchBar.tsx`, `AutocompleteDropdown.tsx`, `FiltersPanel.tsx`, `SearchResultsGrid.tsx`, possibly `FilterChip.tsx`) — Medium-high complexity: autocomplete with keyboard navigation is the most complex piece; filters panel has multiple filter types.
- **New hooks** (~2–3 files: `useDebounce.ts`, `useSearchFilters.ts`, possibly `useAutocomplete.ts`) — Medium complexity: debounce logic, URL state syncing with `nuqs` or `useSearchParams`.
- **`packages/web/package.json`** — Minimal: add `nuqs` dependency if URL state management library is used.

**Risk areas**: The `Header.tsx` change touches a shared layout component rendered on every page. The autocomplete keyboard navigation has high interaction complexity. URL parameter syncing needs careful handling to support browser back/forward. The autocomplete API currently only returns `title` and `slug` (not thumbnail/price), which may require either API extension or a secondary fetch.

```cadre-json
{
  "relevantFiles": [
    { "path": "packages/web/src/components/Header.tsx", "reason": "Contains search bar placeholder that must be upgraded to functional autocomplete search bar" },
    { "path": "packages/web/src/lib/api-client.ts", "reason": "Needs new searchGames and autocomplete API helper methods" },
    { "path": "packages/web/src/components/GameCard.tsx", "reason": "Existing component reused in search results grid; defines GameCardProps interface" },
    { "path": "packages/web/src/app/layout.tsx", "reason": "Root layout with QueryProvider and metadata template used by search page" },
    { "path": "packages/web/src/lib/query-provider.tsx", "reason": "TanStack Query provider that search page hooks depend on" },
    { "path": "packages/web/src/lib/utils.ts", "reason": "cn() utility used by all new components" },
    { "path": "packages/web/src/components/EmptyState.tsx", "reason": "Reusable empty state for no-results display on search page" },
    { "path": "packages/web/src/components/ErrorState.tsx", "reason": "Reusable error state with retry for search error handling" },
    { "path": "packages/web/src/components/LoadingSpinner.tsx", "reason": "Loading indicator for search result fetching" },
    { "path": "packages/web/src/components/DiscountBadge.tsx", "reason": "Used inside GameCard; discount filter chips mirror these thresholds" },
    { "path": "packages/web/src/components/PriceBadge.tsx", "reason": "Used inside GameCard; autocomplete suggestions need similar price rendering" },
    { "path": "packages/web/src/components/StoreIcon.tsx", "reason": "Used inside GameCard for store icon display" },
    { "path": "packages/web/src/components/BuyButton.tsx", "reason": "Used inside GameCard for buy CTA" },
    { "path": "packages/web/src/lib/auth-store.ts", "reason": "Dependency of api-client.ts for auth token injection" },
    { "path": "packages/web/src/app/globals.css", "reason": "Design tokens that new components must use" },
    { "path": "packages/web/package.json", "reason": "May need nuqs dependency for URL search parameter state management" },
    { "path": "packages/web/next.config.ts", "reason": "Image remote patterns may need updates for autocomplete thumbnails" },
    { "path": "packages/api/src/routes/games.ts", "reason": "Backend search and autocomplete endpoints defining response shapes" },
    { "path": "packages/api/src/lib/validation.ts", "reason": "searchQuerySchema and autocompleteQuerySchema define accepted query parameters" },
    { "path": "packages/api/src/openapi.ts", "reason": "OpenAPI spec documents the search and autocomplete API contracts" },
    { "path": "packages/api/src/lib/response.ts", "reason": "buildEnvelopeResponse defines the EnvelopeResponse shape" },
    { "path": "packages/db/src/schema.ts", "reason": "Database schema defines games, genres, stores tables for understanding filter dimensions" }
  ],
  "dependencyMap": {
    "packages/web/src/components/Header.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/components/GameCard.tsx": ["packages/web/src/lib/utils.ts", "packages/web/src/components/PriceBadge.tsx", "packages/web/src/components/DiscountBadge.tsx", "packages/web/src/components/BuyButton.tsx", "packages/web/src/components/StoreIcon.tsx"],
    "packages/web/src/lib/api-client.ts": ["packages/web/src/lib/auth-store.ts"],
    "packages/web/src/lib/query-provider.tsx": [],
    "packages/web/src/app/layout.tsx": ["packages/web/src/lib/query-provider.tsx", "packages/web/src/components/Header.tsx", "packages/web/src/app/globals.css"],
    "packages/web/src/components/EmptyState.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/components/ErrorState.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/components/LoadingSpinner.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/components/DiscountBadge.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/components/PriceBadge.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/components/StoreIcon.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/components/BuyButton.tsx": ["packages/web/src/lib/utils.ts"],
    "packages/web/src/lib/auth-store.ts": [],
    "packages/web/package.json": [],
    "packages/web/next.config.ts": [],
    "packages/api/src/routes/games.ts": ["packages/api/src/lib/validation.ts", "packages/api/src/lib/response.ts", "packages/api/src/middleware/cache.ts"],
    "packages/api/src/lib/validation.ts": [],
    "packages/api/src/openapi.ts": [],
    "packages/db/src/schema.ts": []
  },
  "testFiles": [
    "packages/web/tests/components/Header.test.tsx",
    "packages/web/tests/lib/api-client.test.ts",
    "packages/web/tests/components/GameCard.test.tsx",
    "packages/web/tests/components/EmptyState.test.tsx",
    "packages/web/tests/components/ErrorState.test.tsx",
    "packages/web/tests/components/LoadingSpinner.test.tsx",
    "packages/web/tests/components/DiscountBadge.test.tsx",
    "packages/web/tests/components/PriceBadge.test.tsx",
    "packages/web/tests/components/StoreIcon.test.tsx",
    "packages/web/tests/components/BuyButton.test.tsx",
    "packages/web/tests/app/layout.test.tsx",
    "packages/web/tests/app/page.test.tsx",
    "packages/web/tests/lib/query-provider.test.tsx",
    "packages/api/tests/routes/games.test.ts"
  ],
  "estimatedChanges": [
    { "path": "packages/web/src/components/Header.tsx", "linesEstimate": 40 },
    { "path": "packages/web/src/lib/api-client.ts", "linesEstimate": 30 },
    { "path": "packages/web/src/app/search/page.tsx", "linesEstimate": 150 },
    { "path": "packages/web/src/components/SearchBar.tsx", "linesEstimate": 120 },
    { "path": "packages/web/src/components/AutocompleteDropdown.tsx", "linesEstimate": 100 },
    { "path": "packages/web/src/components/FiltersPanel.tsx", "linesEstimate": 180 },
    { "path": "packages/web/src/components/SearchResultsGrid.tsx", "linesEstimate": 60 },
    { "path": "packages/web/src/lib/useDebounce.ts", "linesEstimate": 20 },
    { "path": "packages/web/src/lib/useSearchFilters.ts", "linesEstimate": 60 },
    { "path": "packages/web/package.json", "linesEstimate": 3 }
  ]
}
```
