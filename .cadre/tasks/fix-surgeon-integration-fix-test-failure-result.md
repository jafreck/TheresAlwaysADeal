# Fix Summary

## Issues Addressed
- `packages/api/tests/lib/password.test.ts` (lines 12, 20, 26, 32): bcrypt password tests timed out at the default 5000ms because `bcryptjs` (pure JS) with cost factor 12 is slow. Added a 30-second timeout to each affected test case.

## Files Modified
- packages/api/tests/lib/password.test.ts

## Files Created
- (none)

## Notes
- The `bcryptjs` library is a pure JavaScript bcrypt implementation which is significantly slower than native bindings. Cost factor 12 results in ~3-7 seconds per hash operation, exceeding the default 5000ms test timeout.
- An alternative approach would be to lower the cost factor in test environments, but increasing the timeout is the more minimal change that doesn't require modifying production code.
