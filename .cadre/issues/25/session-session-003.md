# Session: session-003 - Search results page with filters and results grid

**Rationale:** The search page, filters panel, results grid, and URL state hook are tightly coupled — filters drive the query, the query drives the grid, and URL params sync everything. Building them together in one session ensures consistency.
**Dependencies:** session-001

## Steps

### session-003-step-001: Create useSearchFilters hook
**Description:** Create `packages/web/src/lib/useSearchFilters.ts` that uses `nuqs` to manage search filter state (q, store, genre, min_discount, max_price, sort, page) as URL query parameters. Returns current filter values and setter functions. Supports browser back/forward navigation by reading from URL.
**Files:** packages/web/src/lib/useSearchFilters.ts
**Complexity:** moderate
**Acceptance Criteria:**
- Hook exports `useSearchFilters` from `packages/web/src/lib/useSearchFilters.ts`
- Manages `q`, `store`, `genre`, `min_discount`, `max_price`, `sort`, and `page` as URL query parameters via `nuqs`
- Returns current filter values and individual setter functions
- Changing a filter resets `page` to 1
- Browser back/forward navigation updates the returned filter values

### session-003-step-002: Create FiltersPanel component
**Description:** Create `packages/web/src/components/FiltersPanel.tsx` with store checkboxes (Steam, GOG, Epic, Humble, Fanatical), genre multi-select chips, discount preset chips (25%+, 50%+, 75%+, 90%+), max price options ($5, $10, $20, $30, free only), and sort selector (Best Match, Highest Discount, Lowest Price, A–Z, Release Date). On desktop it renders as a sidebar; on mobile it renders inside a Radix Dialog drawer.
**Files:** packages/web/src/components/FiltersPanel.tsx
**Complexity:** complex
**Acceptance Criteria:**
- Renders store checkboxes for Steam, GOG, Epic, Humble, Fanatical
- Renders discount preset chips for 25%+, 50%+, 75%+, 90%+
- Renders max price preset options for $5, $10, $20, $30, and free only
- Renders sort selector with options: Best Match, Highest Discount, Lowest Price, A–Z, Release Date
- On desktop (md+), renders as a visible sidebar panel
- On mobile (<md), renders inside a dialog/drawer toggled by a 'Filters' button
- Accepts current filter values and onChange callbacks as props
- All filter interactions call the corresponding onChange callback without page reload

### session-003-step-003: Create SearchResultsGrid component
**Description:** Create `packages/web/src/components/SearchResultsGrid.tsx` that renders a responsive grid of `GameCard` components from search result data. Includes a result count header, loading state with `LoadingSpinner`, empty state with `EmptyState`, and error state with `ErrorState`.
**Files:** packages/web/src/components/SearchResultsGrid.tsx
**Complexity:** moderate
**Acceptance Criteria:**
- Renders a result count header (e.g., '342 results for "witcher"')
- Renders `GameCard` components in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- Shows `LoadingSpinner` when `isLoading` is true
- Shows `EmptyState` with suggestion text when results are empty and not loading
- Shows `ErrorState` with retry button when `error` is provided
- Accepts `results`, `total`, `query`, `isLoading`, `error`, and `onRetry` props

### session-003-step-004: Create search page with infinite scroll and dynamic metadata
**Description:** Create `packages/web/src/app/search/page.tsx` as a Next.js page that reads URL params via `useSearchFilters`, fetches results using `useInfiniteQuery` from TanStack Query calling `apiClient.searchGames`, renders `FiltersPanel` and `SearchResultsGrid`, supports infinite scroll via intersection observer for 'load more', and sets dynamic metadata title 'Search Results for "{query}" | There's Always A Deal'.
**Files:** packages/web/src/app/search/page.tsx
**Complexity:** complex
**Acceptance Criteria:**
- Page is accessible at `/search` route
- Reads `q` and filter params from URL via `useSearchFilters`
- Fetches paginated results using `useInfiniteQuery` with `apiClient.searchGames`
- Renders `FiltersPanel` sidebar on desktop and drawer on mobile
- Renders `SearchResultsGrid` with fetched results
- Implements infinite scroll — loads next page when user scrolls near the bottom (intersection observer)
- Filter changes update URL params and re-fetch results without page reload
- No-results state shows suggestions like 'Try searching for "action" or browse deals'
- Page has a dynamic `<title>` element: 'Search Results for "{query}" | There's Always A Deal'