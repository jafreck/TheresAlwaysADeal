# Fix Summary

## Issues Addressed
- `packages/web/src/app/layout.tsx` (line 4): Changed nuqs adapter import from `nuqs/adapters/next` to `nuqs/adapters/next/app`. The generic `nuqs/adapters/next` adapter calls `useSearchParams()` without wrapping it in a `Suspense` boundary, which causes Next.js 15 static generation to fail with "useSearchParams() should be wrapped in a suspense boundary" on the `/search` page. The App Router-specific adapter (`nuqs/adapters/next/app`) internally wraps its `NavigationSpy` component in `Suspense`, resolving the build error.

## Files Modified
- packages/web/src/app/layout.tsx

## Files Created
- (none)

## Notes
- The `/search` page already had a `Suspense` boundary around `SearchPageContent`, but the error originated from the `NuqsAdapter` in the root layout which applies to all pages during prerendering.
