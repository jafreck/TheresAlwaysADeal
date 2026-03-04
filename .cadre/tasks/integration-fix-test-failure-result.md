# Fix Summary

## Issues Addressed
- `packages/web/tests/components/Header.test.tsx` (lines 5-8): Fixed jsdom "Not implemented: navigation (except hash changes)" stderr warning by updating the `next/link` mock to call `e.preventDefault()` on click events, preventing jsdom from attempting real navigation while still forwarding onClick handlers to the component.

## Files Modified
- packages/web/tests/components/Header.test.tsx

## Files Created
- (none)

## Notes
- The lint failures in `@taad/db` and `@taad/scraper` are pre-existing issues in unmodified packages and are not addressed by this fix.
- All 612 tests across 44 test files continue to pass.
