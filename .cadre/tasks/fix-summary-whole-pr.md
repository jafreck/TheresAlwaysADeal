# Fix Summary

## Issues Addressed
- `packages/worker/src/index.ts` (line 378): Decrypted `notifySlackWebhook` before enqueuing to notification queue in price-drop alert worker. Moved `encryption.ts` to `@taad/db` shared package so both API and worker can access encrypt/decrypt.
- `packages/worker/src/index.ts` (line 428): Same encrypted-webhook fix applied to all-time-low alert worker — now decrypts before enqueuing.
- `packages/worker/src/index.ts` (line 358): Hoisted the `priceHistory` query above the `for (const alert of activeAlerts)` loop to eliminate N+1 query pattern. The query is constant across iterations.
- `packages/api/src/routes/alerts.ts` (line 67): Added `.for("update")` row-level lock to the count query inside the transaction, preventing concurrent requests from both reading the same count and exceeding the 100-alert cap.

## Files Modified
- packages/db/src/index.ts (added encryption re-export)
- packages/worker/src/index.ts (decrypt import, hoisted query, decrypt before enqueue)
- packages/api/src/routes/alerts.ts (added `.for("update")` to count query)
- packages/api/tests/routes/alerts.test.ts (added `for` to mock builder chains)
- packages/worker/tests/index.test.ts (added `decrypt` mock, updated webhook assertion, added priceHistory mock for hoisted query)

## Files Created
- packages/db/src/encryption.ts (shared encryption module moved from API package)

## Notes
- `packages/api/src/lib/encryption.ts` is kept as-is to avoid disrupting existing imports and test mocks in the API package. Both copies are identical; a future cleanup could have the API package re-export from `@taad/db`.
- The pre-existing `@taad/web` lint failure (triple-slash reference in auto-generated `next-env.d.ts`) is unrelated and was not addressed.
