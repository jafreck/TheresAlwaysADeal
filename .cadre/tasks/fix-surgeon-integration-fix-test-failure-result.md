# Fix Summary

## Issues Addressed
- `packages/web/src/lib/useAuth.ts` (login function): Added missing `apiClient.get("/api/auth/me")` call and `setUserProfile` after successful login. The `register` function already fetched the user profile, but `login` did not, causing the test expectation `expect(mockGet).toHaveBeenCalledWith('/api/auth/me')` to fail.
- `packages/web` (missing dependency): `@hookform/resolvers` was declared in `package.json` but not installed in `node_modules`. Ran `pnpm install` to resolve the 4 page test import failures.

## Files Modified
- packages/web/src/lib/useAuth.ts

## Files Created
- (none)

## Notes
- The `@hookform/resolvers` package was already declared as a dependency; it just needed `pnpm install` to be run.
- All 73 test files (1127 tests) now pass. Build succeeds for all 7 packages.
