# Fix Summary

## Issues Addressed
- `packages/api/src/lib/validation.ts` (line 17, 33–41): The `sortSchema` only allowed `"release_date"` and was not merged into `searchQuerySchema`. Expanded `sortSchema` to accept all frontend sort values (`best_match`, `highest_discount`, `lowest_price`, `a_z`, `release_date`) and merged it into `searchQuerySchema` so the backend no longer silently strips the sort parameter.
- `packages/api/src/routes/games.ts` (line 104, 204): The search route did not destructure or use the `sort` parameter from parsed query data. Added `sort` to destructuring and implemented sort-aware ordering in the search query.
- `packages/web/src/components/FiltersPanel.tsx`: The reviewer flagged missing genre UI, but inspection shows genre multi-select chips, `FilterValues.genre`, and `onGenreChange` wiring are all already present. No changes needed.

## Files Modified
- packages/api/src/lib/validation.ts
- packages/api/src/routes/games.ts
- packages/api/tests/lib/validation.test.ts

## Files Created
- (none)

## Notes
- The `AutocompleteDropdown` suggestion (issue #3) was not addressed as it is constrained by the backend autocomplete API which only returns title and slug, as noted in analysis.md.
- Pre-existing build failures (`@hookform/resolvers/zod` missing, `useAuth` test) are unrelated to these changes.
