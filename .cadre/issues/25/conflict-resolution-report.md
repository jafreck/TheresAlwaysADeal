# Conflict Resolution Report

## Summary
Resolved 6 conflicted file(s) while rebasing issue #25 onto main.

## What the Base Branch Introduced
The `main` branch added a `"newest"` sort option to the sort enum in the validation schema (alongside the existing `"release_date"`), and added corresponding tests. It also had a simpler `useAuth` login flow without post-login profile fetching, and no SearchBar component integration in the Header.

## Files Resolved

### `packages/api/src/lib/validation.ts`
- **Conflict regions**: 1
- **Resolution**: Merged both sort enums. HEAD added search-specific sort values (`best_match`, `highest_discount`, `lowest_price`, `a_z`) while main added `newest`. Combined into a single enum containing all values: `["best_match", "highest_discount", "lowest_price", "a_z", "release_date", "newest"]`.

### `packages/api/tests/lib/validation.test.ts`
- **Conflict regions**: 1
- **Resolution**: Updated the "should accept valid sort values" test to iterate over all combined sort values from both sides. Existing tests for `newest` in `commonQuerySchema` and rejected values were already compatible.

### `packages/web/src/components/Header.tsx`
- **Conflict regions**: 1
- **Resolution**: Kept HEAD's `import SearchBar from "./SearchBar"` since the `<SearchBar />` component is used in the template body (both desktop and mobile views). Main had no import because it didn't have the SearchBar feature.

### `packages/web/src/lib/useAuth.ts`
- **Conflict regions**: 1
- **Resolution**: Kept HEAD's login implementation which fetches the user profile via `/api/auth/me` after successful login and calls `setUserProfile(profile)`. This is consistent with the `register` function (no conflict) which follows the same pattern, and is required by the branch's feature (displaying user info in the Header).

### `packages/web/tests/components/Header.test.tsx`
- **Conflict regions**: 1
- **Resolution**: Kept HEAD's expanded `useRouter` mock (with `replace` and `back`) and the `@tanstack/react-query` mock. These are needed because the Header now renders SearchBar, which depends on react-query for autocomplete and the full router API.

### `packages/web/tsconfig.tsbuildinfo`
- **Conflict regions**: 1
- **Resolution**: Took main's version. This is an auto-generated build artifact that gets regenerated on every build.

## Notes
- All 1196 tests pass across 77 test files.
- Build completes successfully for all packages.
- The combined sort enum preserves backward compatibility with both main's `newest` option and HEAD's search-specific sort options.
