# Fix Summary

## Issues Addressed
- `packages/api/src/routes/user.ts` (line 179): GDPR deletion did not clear `slackWebhookUrl`. Added `slackWebhookUrl: null` to the `.set(...)` call in the DELETE /me handler to anonymize this user-configured field alongside other PII.

## Files Modified
- packages/api/src/routes/user.ts
- packages/api/tests/routes/user.test.ts

## Files Created
- (none)

## Notes
- The test expectation was also updated to assert that `slackWebhookUrl: null` is included in the anonymization update call.
