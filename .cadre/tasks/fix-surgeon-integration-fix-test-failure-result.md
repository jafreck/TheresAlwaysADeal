# Fix Summary

## Issues Addressed
- `packages/api/tests/lib/password.test.ts` (lines 12, 20, 26, 32): bcrypt password tests timed out at the default 5000ms because `bcryptjs` (pure JS) with cost factor 12 is slow. Added a 30-second timeout to each affected test case.
- `packages/web/src/lib/useAuth.ts` (login function): Added missing `apiClient.get("/api/auth/me")` call and `setUserProfile` after successful login. The `register` function already fetched the user profile, but `login` did not, causing the test expectation `expect(mockGet).toHaveBeenCalledWith('/api/auth/me')` to fail.
- `packages/web` (missing dependency): `@hookform/resolvers` was declared in `package.json` but not installed in `node_modules`. Ran `pnpm install` to resolve the 4 page test import failures.

## Files Modified
- packages/api/tests/lib/password.test.ts
- packages/web/src/lib/useAuth.ts

## Files Created
- (none)

## Notes
- The `bcryptjs` library is a pure JavaScript bcrypt implementation which is significantly slower than native bindings. Cost factor 12 results in ~3-7 seconds per hash operation, exceeding the default 5000ms test timeout.
- An alternative approach would be to lower the cost factor in test environments, but increasing the timeout is the more minimal change that doesn't require modifying production code.
- The `@hookform/resolvers` package was already declared as a dependency; it just needed `pnpm install` to be run.
- All 73 test files (1127 tests) now pass. Build succeeds for all 7 packages.
