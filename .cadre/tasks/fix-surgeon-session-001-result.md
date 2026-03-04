# Fix Summary

## Issues Addressed
- `packages/email/src/index.ts` (line 102): Separated the success-path DB insert from the email send try/catch so that a DB failure after a successful send no longer records emailStatus as 'failed'. The email send and success logging now use independent try/catch blocks with an early return on send failure.
- `packages/email/src/templates.ts` (line 35): Added `escapeHtml` utility and applied it to all user-sourced strings (`gameTitle`, `storeName`, `price`) interpolated into HTML to prevent broken rendering from special characters.

## Files Modified
- packages/email/src/index.ts
- packages/email/src/templates.ts

## Files Created
- (none)

## Notes
- The `sendPriceAlert` function now logs a distinct console message when the email succeeds but DB logging fails, aiding debuggability.
- URL parameters (`imageUrl`, `referralUrl`, `unsubscribeUrl`) are not escaped since they are system-generated, not user-sourced text content.
