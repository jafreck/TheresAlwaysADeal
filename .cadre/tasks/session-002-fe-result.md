# Task Result: session-002-fe - SearchBar with autocomplete and Header integration

## Changes Made
- `packages/web/src/components/AutocompleteDropdown.tsx`: Created new component rendering a dropdown listbox with up to 5 suggestions plus a "See all results" footer action, with `aria-selected` for keyboard highlighting and mouse click support.
- `packages/web/src/components/SearchBar.tsx`: Created new component wrapping a search input with debounced autocomplete fetching (200ms via `useDebounce` + TanStack Query), keyboard navigation (↑/↓/Enter/Escape), `useRouter` navigation to `/search?q=` or `/games/{slug}`, and full ARIA combobox attributes.
- `packages/web/src/components/Header.tsx`: Replaced static search `<input>` placeholders in both desktop and mobile sections with `<SearchBar />` component.
- `packages/web/tests/components/Header.test.tsx`: Added mocks for `next/navigation` (useRouter) and `@tanstack/react-query` (useQuery) so existing Header tests pass with the new SearchBar dependency.

## Files Modified
- packages/web/src/components/Header.tsx
- packages/web/tests/components/Header.test.tsx

## Files Created
- packages/web/src/components/AutocompleteDropdown.tsx
- packages/web/src/components/SearchBar.tsx

## Notes
- AutocompleteDropdown uses `onMouseDown={(e) => e.preventDefault()}` on the listbox to prevent input blur when clicking suggestions.
- SearchBar uses a 150ms blur timeout to allow click events on dropdown items to fire before closing.
- All 21 existing Header tests pass after the changes.
