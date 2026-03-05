# Implementation Plan — Issue #25: Search Results Page & Global Search Bar

## Overview

This plan implements the search results page, global search bar with autocomplete, and filters panel for the TheresAlwaysADeal web frontend. The work is split into 3 sessions: foundational hooks & API layer, search bar with autocomplete, and the search results page with filters.

---

## Session 1: API helpers, hooks, and utility foundations

Add the API client methods for search/autocomplete, the `useDebounce` hook, and install `nuqs` for URL state management. These are consumed by all subsequent sessions.

## Session 2: SearchBar with autocomplete and Header integration

Build the `SearchBar` component with debounced autocomplete, keyboard navigation, and the `AutocompleteDropdown`. Integrate into `Header.tsx` replacing the static placeholder.

## Session 3: Search results page, filters panel, and results grid

Build the `/search` route page with `FiltersPanel`, `SearchResultsGrid`, URL parameter syncing via `nuqs`, infinite scroll, dynamic metadata, and empty/error/loading states.

---

```cadre-json
[
  {
    "id": "session-001",
    "name": "API helpers, useDebounce hook, and nuqs dependency",
    "rationale": "The API client methods and useDebounce hook are foundational — every other session depends on them being in place first.",
    "dependencies": [],
    "steps": [
      {
        "id": "session-001-step-001",
        "name": "Install nuqs dependency",
        "description": "Add the `nuqs` package to `packages/web/package.json` for type-safe URL search parameter state management used by the search page filters.",
        "files": ["packages/web/package.json"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`nuqs` is listed in `dependencies` in `packages/web/package.json`",
          "`pnpm install` completes without errors"
        ]
      },
      {
        "id": "session-001-step-002",
        "name": "Add useDebounce hook",
        "description": "Create a `useDebounce` custom hook in `packages/web/src/lib/useDebounce.ts` that returns a debounced value after a configurable delay (default 200ms). This is used by the autocomplete search bar.",
        "files": ["packages/web/src/lib/useDebounce.ts"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "`useDebounce` is exported from `packages/web/src/lib/useDebounce.ts`",
          "Accepts a generic value `T` and a `delay` number parameter (default 200)",
          "Returns the debounced value that updates only after the delay elapses"
        ]
      },
      {
        "id": "session-001-step-003",
        "name": "Add search and autocomplete API client methods",
        "description": "Add `searchGames` and `autocomplete` helper functions to `packages/web/src/lib/api-client.ts`. `searchGames` calls `GET /api/v1/games/search` with query, pagination, and filter params, returning `EnvelopeResponse`. `autocomplete` calls `GET /api/v1/games/autocomplete` returning `{ data: Array<{ title, slug }> }`.",
        "files": ["packages/web/src/lib/api-client.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "`apiClient.searchGames` is exported and accepts `{ q, page?, limit?, store?, genre?, min_discount?, max_price? }`",
          "`apiClient.autocomplete` is exported and accepts `{ q, limit? }`",
          "`searchGames` constructs query string from params and calls `GET /api/v1/games/search?...`",
          "`autocomplete` constructs query string and calls `GET /api/v1/games/autocomplete?q=...&limit=...`",
          "Both methods use the existing `request` function (inheriting auth headers and error handling)",
          "TypeScript interfaces for search result and autocomplete result are exported"
        ]
      }
    ]
  },
  {
    "id": "session-002",
    "name": "SearchBar with autocomplete and Header integration",
    "rationale": "The SearchBar, AutocompleteDropdown, and Header update form a tight dependency chain — the dropdown is rendered inside the SearchBar, which replaces the Header's placeholder input.",
    "dependencies": ["session-001"],
    "steps": [
      {
        "id": "session-002-step-001",
        "name": "Create AutocompleteDropdown component",
        "description": "Create `packages/web/src/components/AutocompleteDropdown.tsx` that renders a dropdown list of up to 5 autocomplete suggestions (title and slug) plus a 'See all results' footer action. Supports keyboard navigation (↑/↓ arrows, Enter to select, Escape to close) and mouse click selection.",
        "files": ["packages/web/src/components/AutocompleteDropdown.tsx"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "Component renders a list of suggestions with `role=\"listbox\"` and items with `role=\"option\"`",
          "Each suggestion displays the game title",
          "A 'See all results' action is rendered at the bottom of the dropdown",
          "Arrow keys move the highlighted index up/down with `aria-selected` attribute",
          "Enter key on a suggestion calls `onSelect(slug)`, Enter on 'See all results' calls `onSeeAll()`",
          "Escape key calls `onClose()`",
          "Clicking a suggestion calls `onSelect(slug)`",
          "Component accepts `suggestions`, `highlightedIndex`, `onSelect`, `onSeeAll`, `onClose`, and `isOpen` props"
        ]
      },
      {
        "id": "session-002-step-002",
        "name": "Create SearchBar component",
        "description": "Create `packages/web/src/components/SearchBar.tsx` that wraps an input field with debounced autocomplete fetching via TanStack Query and the `useDebounce` hook. Manages open/close state of the AutocompleteDropdown, keyboard navigation state, and navigates to `/search?q=` on Enter or to game detail on suggestion select.",
        "files": ["packages/web/src/components/SearchBar.tsx"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "Renders a search `<input>` with `type=\"search\"` and `aria-label=\"Search games\"`",
          "Uses `useDebounce` with 200ms delay on the input value",
          "Fetches autocomplete results via `apiClient.autocomplete` using `useQuery` from TanStack Query when debounced value length >= 2",
          "Opens AutocompleteDropdown when suggestions are available and input is focused",
          "Keyboard: ↑/↓ navigate suggestions, Enter on empty selection navigates to `/search?q={value}`, Enter on selection navigates to game, Escape closes dropdown",
          "Clicking 'See all results' navigates to `/search?q={value}`",
          "Dropdown closes when input loses focus (with a small delay for click events)",
          "Has `aria-expanded`, `aria-controls`, `aria-activedescendant` attributes for accessibility",
          "Accepts optional `className` prop for styling flexibility"
        ]
      },
      {
        "id": "session-002-step-003",
        "name": "Integrate SearchBar into Header",
        "description": "Replace the static search `<input>` placeholders in `Header.tsx` (both desktop and mobile) with the new `<SearchBar />` component. The Header's structure and styling remain otherwise unchanged.",
        "files": ["packages/web/src/components/Header.tsx"],
        "complexity": "simple",
        "acceptanceCriteria": [
          "Desktop search area renders `<SearchBar />` instead of a plain `<input>`",
          "Mobile search area renders `<SearchBar />` instead of a plain `<input>`",
          "Existing Header layout, navigation links, and mobile menu behavior are preserved",
          "Existing Header tests continue to pass (search inputs are now inside SearchBar)"
        ]
      }
    ]
  },
  {
    "id": "session-003",
    "name": "Search results page with filters and results grid",
    "rationale": "The search page, filters panel, results grid, and URL state hook are tightly coupled — filters drive the query, the query drives the grid, and URL params sync everything. Building them together in one session ensures consistency.",
    "dependencies": ["session-001"],
    "steps": [
      {
        "id": "session-003-step-001",
        "name": "Create useSearchFilters hook",
        "description": "Create `packages/web/src/lib/useSearchFilters.ts` that uses `nuqs` to manage search filter state (q, store, genre, min_discount, max_price, sort, page) as URL query parameters. Returns current filter values and setter functions. Supports browser back/forward navigation by reading from URL.",
        "files": ["packages/web/src/lib/useSearchFilters.ts"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "Hook exports `useSearchFilters` from `packages/web/src/lib/useSearchFilters.ts`",
          "Manages `q`, `store`, `genre`, `min_discount`, `max_price`, `sort`, and `page` as URL query parameters via `nuqs`",
          "Returns current filter values and individual setter functions",
          "Changing a filter resets `page` to 1",
          "Browser back/forward navigation updates the returned filter values"
        ]
      },
      {
        "id": "session-003-step-002",
        "name": "Create FiltersPanel component",
        "description": "Create `packages/web/src/components/FiltersPanel.tsx` with store checkboxes (Steam, GOG, Epic, Humble, Fanatical), genre multi-select chips, discount preset chips (25%+, 50%+, 75%+, 90%+), max price options ($5, $10, $20, $30, free only), and sort selector (Best Match, Highest Discount, Lowest Price, A–Z, Release Date). On desktop it renders as a sidebar; on mobile it renders inside a Radix Dialog drawer.",
        "files": ["packages/web/src/components/FiltersPanel.tsx"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "Renders store checkboxes for Steam, GOG, Epic, Humble, Fanatical",
          "Renders discount preset chips for 25%+, 50%+, 75%+, 90%+",
          "Renders max price preset options for $5, $10, $20, $30, and free only",
          "Renders sort selector with options: Best Match, Highest Discount, Lowest Price, A–Z, Release Date",
          "On desktop (md+), renders as a visible sidebar panel",
          "On mobile (<md), renders inside a dialog/drawer toggled by a 'Filters' button",
          "Accepts current filter values and onChange callbacks as props",
          "All filter interactions call the corresponding onChange callback without page reload"
        ]
      },
      {
        "id": "session-003-step-003",
        "name": "Create SearchResultsGrid component",
        "description": "Create `packages/web/src/components/SearchResultsGrid.tsx` that renders a responsive grid of `GameCard` components from search result data. Includes a result count header, loading state with `LoadingSpinner`, empty state with `EmptyState`, and error state with `ErrorState`.",
        "files": ["packages/web/src/components/SearchResultsGrid.tsx"],
        "complexity": "moderate",
        "acceptanceCriteria": [
          "Renders a result count header (e.g., '342 results for \"witcher\"')",
          "Renders `GameCard` components in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop)",
          "Shows `LoadingSpinner` when `isLoading` is true",
          "Shows `EmptyState` with suggestion text when results are empty and not loading",
          "Shows `ErrorState` with retry button when `error` is provided",
          "Accepts `results`, `total`, `query`, `isLoading`, `error`, and `onRetry` props"
        ]
      },
      {
        "id": "session-003-step-004",
        "name": "Create search page with infinite scroll and dynamic metadata",
        "description": "Create `packages/web/src/app/search/page.tsx` as a Next.js page that reads URL params via `useSearchFilters`, fetches results using `useInfiniteQuery` from TanStack Query calling `apiClient.searchGames`, renders `FiltersPanel` and `SearchResultsGrid`, supports infinite scroll via intersection observer for 'load more', and sets dynamic metadata title 'Search Results for \"{query}\" | There's Always A Deal'.",
        "files": ["packages/web/src/app/search/page.tsx"],
        "complexity": "complex",
        "acceptanceCriteria": [
          "Page is accessible at `/search` route",
          "Reads `q` and filter params from URL via `useSearchFilters`",
          "Fetches paginated results using `useInfiniteQuery` with `apiClient.searchGames`",
          "Renders `FiltersPanel` sidebar on desktop and drawer on mobile",
          "Renders `SearchResultsGrid` with fetched results",
          "Implements infinite scroll — loads next page when user scrolls near the bottom (intersection observer)",
          "Filter changes update URL params and re-fetch results without page reload",
          "No-results state shows suggestions like 'Try searching for \"action\" or browse deals'",
          "Page has a dynamic `<title>` element: 'Search Results for \"{query}\" | There's Always A Deal'"
        ]
      }
    ]
  }
]
```
