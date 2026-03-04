# Fix Summary

## Issues Addressed
- `packages/worker/src/index.ts` (line 431): Duplicated HMAC signing logic replaced with shared `@taad/crypto` package import, eliminating drift risk between worker and API implementations.

## Files Modified
- packages/api/src/lib/jwt.ts
- packages/api/package.json
- packages/worker/src/index.ts
- packages/worker/package.json

## Files Created
- packages/crypto/package.json
- packages/crypto/tsconfig.json
- packages/crypto/src/index.ts

## Notes
- The `@taad/crypto` package exports `signUnsubscribeToken(alertId, secret)` and `verifyUnsubscribeToken(token, secret)` with the secret as an explicit parameter, keeping env-var access in the consuming packages.
- `packages/api/src/lib/jwt.ts` re-exports wrapper functions that inject the secret from `getAccessSecret()`, preserving the existing public API for all callers and tests.
- All 822 existing tests pass without modification.

