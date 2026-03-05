```cadre-json
{
  "verdict": "needs-fixes",
  "summary": "The webhook URL is persisted to the database before the test message is sent, so an invalid webhook remains stored when the test returns 4xx. The worker also duplicates AES-256-GCM decryption logic from the API's encryption module but omits the key-length validation, which could produce confusing errors if the key is misconfigured.",
  "issues": [
    {
      "file": "packages/api/src/routes/user-alerts.ts",
      "line": 34,
      "severity": "warning",
      "description": "The webhook URL is encrypted and stored in the database (lines 33-37) before the test message is sent (line 40). If `sendPriceAlert` returns `{ ok: false, reason: 'invalid_webhook' }`, the route returns 400 but the invalid webhook is already persisted on the user record. The notification worker will later attempt to use this invalid webhook, fail, and disable it — generating a spurious email-stub notification. Move the DB write to after the test message succeeds, or roll it back on failure."
    },
    {
      "file": "packages/worker/src/index.ts",
      "line": 20,
      "severity": "warning",
      "description": "The `decryptWebhookUrl` function duplicates AES-256-GCM decryption logic from `packages/api/src/lib/encryption.ts` but omits the key-length validation (`key.length !== 32` check). If `SLACK_ENCRYPTION_KEY` is set to an incorrect length, the API throws a clear error while the worker will throw a generic crypto error. Consider importing `decrypt` from a shared package or at minimum replicating the key-length guard."
    }
  ]
}
```
