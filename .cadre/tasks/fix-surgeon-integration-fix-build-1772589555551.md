# Fix Summary

## Issues Addressed
- `packages/web`: Build failure due to `@hookform/resolvers/zod` module not found — resolved by running `pnpm install` to properly link the already-declared dependency
- `packages/web/src/lib/useAuth.ts` (line 23-30): `login` function did not fetch user profile after authentication, causing test failure — added `apiClient.get('/api/auth/me')` call and `setUserProfile` to match `register` behavior

## Files Modified
- packages/web/src/lib/useAuth.ts

## Files Created
- (none)

## Notes
- The `@hookform/resolvers` dependency was already declared in `packages/web/package.json` but `pnpm install` had not been run after the dependency was added, causing the build to fail
- The `login` function was missing the profile fetch that `register` already had; the test correctly expected this behavior
