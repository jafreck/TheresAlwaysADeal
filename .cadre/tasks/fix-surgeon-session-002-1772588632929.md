# Fix Summary

## Issues Addressed
- `packages/web/tests/app/search/page.test.tsx` (line 49–61): Widened the `data` array type in `mockPages` from a narrow camelCase-only inferred type to `Record<string, unknown>[]` by adding an `as` assertion. This resolves the `TS2561` error where the snake_case test mock (line 253) assigned properties not present in the original inferred type.

## Files Modified
- packages/web/tests/app/search/page.test.tsx

## Files Created
- (none)

## Notes
- The fix uses `as Record<string, unknown>[]` on the `data` array in `mockPages`, which matches how `mapResultToCard` in `page.tsx` already expects `Record<string, unknown>` items. This is the minimal change that resolves the type incompatibility without altering test logic.
