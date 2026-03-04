# Issue #25 — [FE-25] Search Results Page & Global Search Bar

## Requirements

1. Implement a `/search` route/page in the Next.js app that displays search results in a grid using existing `<GameCard>` components
2. Show a result count header (e.g., "342 results for 'witcher'") above the results grid
3. Implement a no-results empty state with suggestions (e.g., "Try searching for 'action' or browse deals")
4. Upgrade the existing Header search bar placeholder to a functional search bar with debounced autocomplete (200ms debounce)
5. Autocomplete dropdown shows top 5 suggestions from `GET /api/games/autocomplete?q=` with game cover thumbnail, title, and best current price
6. Include a "See all results" action in the autocomplete dropdown; pressing Enter navigates to `/search?q=`
7. Autocomplete dropdown must be keyboard navigable (↑/↓ arrows, Enter to select, Escape to close)
8. Implement a filters panel (sidebar on desktop, drawer on mobile) with: Store checkboxes (Steam, GOG, Epic, Humble, Fanatical), Genre multi-select chips, Discount preset chips (25%+, 50%+, 75%+, 90%+), Max price options ($5, $10, $20, $30, free only), Sort (Best Match, Highest Discount, Lowest Price, A–Z, Release Date)
9. Sync all filter and sort state to URL query parameters using `nuqs` or `useSearchParams` so URLs are shareable/bookmarkable
10. Browser back/forward navigation must correctly update filter state and results
11. Filters must update results without a full page reload
12. Fetch search results from `GET /api/games/search?q=&...filters` using TanStack Query
13. Implement pagination or infinite scroll for search results
14. Set dynamic meta title: "Search Results for '{query}' | There's Always A Deal"

## Change Type
feature

## Scope Estimate
large

## Scout Policy
required

## Affected Areas
- `packages/web/src/app/search/` — new `/search` route page and layout
- `packages/web/src/components/Header.tsx` — upgrade search bar placeholder to functional autocomplete
- `packages/web/src/components/` — new components: SearchBar, AutocompleteDropdown, FiltersPanel, FilterChip, DiscountSlider, SearchResultsGrid
- `packages/web/src/lib/api-client.ts` — add search and autocomplete API helper methods
- `packages/web/src/lib/` — possible new hooks (useSearchFilters, useDebounce, useAutocomplete)
- `packages/web/tests/` — tests for new search page, components, and hooks
- `packages/web/package.json` — may need `nuqs` dependency for URL state management

## Ambiguities
1. The issue mentions "pagination / infinite scroll" — it's unclear which pattern is preferred; infinite scroll is more complex and may require a specific implementation choice (intersection observer vs. button-triggered load-more).
2. The autocomplete endpoint schema in the OpenAPI spec returns `title` and `slug` but the issue requires "game cover thumbnail" and "best current price" in suggestions — the autocomplete API may need to be extended or a separate endpoint used.
3. The issue references `GET /api/games/search` but the existing API base URL pattern uses `/api/v1/` — the actual endpoint path needs to be confirmed against the API implementation.
4. The "Discount" filter is described as "slider or preset chips" — the exact UI variant needs to be decided.
5. The "Genre" filter requires genre data — it's unclear whether genres are available from the API or need to be fetched from a separate endpoint.
6. Dependency on #22 (Frontend Framework Setup & Design System) and #14 (Game Search API) — the status of these dependencies is not confirmed; if the search API is not yet implemented, the frontend may need to be built against mock data or stubs.

```cadre-json
{
  "requirements": [
    "Implement a /search route/page in the Next.js app that displays search results in a grid using existing <GameCard> components",
    "Show a result count header (e.g., '342 results for witcher') above the results grid",
    "Implement a no-results empty state with suggestions (e.g., 'Try searching for action or browse deals')",
    "Upgrade the existing Header search bar placeholder to a functional search bar with debounced autocomplete (200ms debounce)",
    "Autocomplete dropdown shows top 5 suggestions from GET /api/games/autocomplete?q= with game cover thumbnail, title, and best current price",
    "Include a 'See all results' action in the autocomplete dropdown; pressing Enter navigates to /search?q=",
    "Autocomplete dropdown must be keyboard navigable (up/down arrows, Enter to select, Escape to close)",
    "Implement a filters panel (sidebar on desktop, drawer on mobile) with Store checkboxes, Genre multi-select chips, Discount preset chips, Max price options, and Sort selector",
    "Sync all filter and sort state to URL query parameters so URLs are shareable/bookmarkable",
    "Browser back/forward navigation must correctly update filter state and results",
    "Filters must update results without a full page reload",
    "Fetch search results from GET /api/games/search using TanStack Query",
    "Implement pagination or infinite scroll for search results",
    "Set dynamic meta title: Search Results for '{query}' | There's Always A Deal"
  ],
  "changeType": "feature",
  "scope": "large",
  "scoutPolicy": "required",
  "affectedAreas": [
    "packages/web/src/app/search/",
    "packages/web/src/components/Header.tsx",
    "packages/web/src/components/ (new: SearchBar, AutocompleteDropdown, FiltersPanel, SearchResultsGrid)",
    "packages/web/src/lib/api-client.ts",
    "packages/web/src/lib/ (new hooks: useSearchFilters, useDebounce, useAutocomplete)",
    "packages/web/tests/",
    "packages/web/package.json"
  ],
  "ambiguities": [
    "Pagination vs infinite scroll — the issue lists both as options without specifying a preference",
    "Autocomplete API returns only title and slug per OpenAPI spec, but issue requires cover thumbnail and best price in suggestions — API may need extension",
    "API base path discrepancy: issue references /api/games/search but OpenAPI spec uses /api/v1/ prefix",
    "Discount filter UI is ambiguous — 'slider or preset chips' not decided",
    "Genre data source is not specified — unclear if a genres endpoint exists",
    "Dependencies #22 and #14 status unknown — search API may not be implemented yet"
  ]
}
```
