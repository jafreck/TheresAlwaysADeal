# Session: session-002 - SearchBar with autocomplete and Header integration

**Rationale:** The SearchBar, AutocompleteDropdown, and Header update form a tight dependency chain — the dropdown is rendered inside the SearchBar, which replaces the Header's placeholder input.
**Dependencies:** session-001

## Steps

### session-002-step-001: Create AutocompleteDropdown component
**Description:** Create `packages/web/src/components/AutocompleteDropdown.tsx` that renders a dropdown list of up to 5 autocomplete suggestions (title and slug) plus a 'See all results' footer action. Supports keyboard navigation (↑/↓ arrows, Enter to select, Escape to close) and mouse click selection.
**Files:** packages/web/src/components/AutocompleteDropdown.tsx
**Complexity:** complex
**Acceptance Criteria:**
- Component renders a list of suggestions with `role="listbox"` and items with `role="option"`
- Each suggestion displays the game title
- A 'See all results' action is rendered at the bottom of the dropdown
- Arrow keys move the highlighted index up/down with `aria-selected` attribute
- Enter key on a suggestion calls `onSelect(slug)`, Enter on 'See all results' calls `onSeeAll()`
- Escape key calls `onClose()`
- Clicking a suggestion calls `onSelect(slug)`
- Component accepts `suggestions`, `highlightedIndex`, `onSelect`, `onSeeAll`, `onClose`, and `isOpen` props

### session-002-step-002: Create SearchBar component
**Description:** Create `packages/web/src/components/SearchBar.tsx` that wraps an input field with debounced autocomplete fetching via TanStack Query and the `useDebounce` hook. Manages open/close state of the AutocompleteDropdown, keyboard navigation state, and navigates to `/search?q=` on Enter or to game detail on suggestion select.
**Files:** packages/web/src/components/SearchBar.tsx
**Complexity:** complex
**Acceptance Criteria:**
- Renders a search `<input>` with `type="search"` and `aria-label="Search games"`
- Uses `useDebounce` with 200ms delay on the input value
- Fetches autocomplete results via `apiClient.autocomplete` using `useQuery` from TanStack Query when debounced value length >= 2
- Opens AutocompleteDropdown when suggestions are available and input is focused
- Keyboard: ↑/↓ navigate suggestions, Enter on empty selection navigates to `/search?q={value}`, Enter on selection navigates to game, Escape closes dropdown
- Clicking 'See all results' navigates to `/search?q={value}`
- Dropdown closes when input loses focus (with a small delay for click events)
- Has `aria-expanded`, `aria-controls`, `aria-activedescendant` attributes for accessibility
- Accepts optional `className` prop for styling flexibility

### session-002-step-003: Integrate SearchBar into Header
**Description:** Replace the static search `<input>` placeholders in `Header.tsx` (both desktop and mobile) with the new `<SearchBar />` component. The Header's structure and styling remain otherwise unchanged.
**Files:** packages/web/src/components/Header.tsx
**Complexity:** simple
**Acceptance Criteria:**
- Desktop search area renders `<SearchBar />` instead of a plain `<input>`
- Mobile search area renders `<SearchBar />` instead of a plain `<input>`
- Existing Header layout, navigation links, and mobile menu behavior are preserved
- Existing Header tests continue to pass (search inputs are now inside SearchBar)