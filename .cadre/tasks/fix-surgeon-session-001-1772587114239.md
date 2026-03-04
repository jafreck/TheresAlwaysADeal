# Fix Summary

## Issues Addressed
- `packages/web/src/lib/useDebounce.ts` (lines 7–8): ESLint `no-undef` errors for `setTimeout` and `clearTimeout` browser globals. Fixed by adding `/* eslint-disable no-undef */` directive at the top of the file, consistent with the existing pattern in `api-client.ts`.

## Files Modified
- packages/web/src/lib/useDebounce.ts

## Files Created
- (none)

## Notes
- The root cause is the ESLint configuration not recognizing browser globals. The `/* eslint-disable no-undef */` directive matches the workaround already used in `api-client.ts`. A broader fix would be configuring ESLint with `env: { browser: true }`, but that is outside the scope of this issue.
