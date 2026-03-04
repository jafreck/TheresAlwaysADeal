# Session: session-001 - Schema, encryption, and config

**Rationale:** These foundational changes (DB columns, encryption utility, env config) are prerequisites for all Slack notification functionality in sessions 2 and 3.
**Dependencies:** none

## Steps

### session-001-step-001: Add Slack webhook and channel columns to schema
**Description:** Add a nullable `notifySlackWebhook` text column to the `users` and `priceAlerts` tables, and add a nullable `channel` varchar column (default 'email') to the `alertNotifications` table in packages/db/src/schema.ts.
**Files:** packages/db/src/schema.ts, packages/db/tests/schema.test.ts
**Complexity:** simple
**Acceptance Criteria:**
- `users` table has a `notifySlackWebhook` column of type text, nullable
- `priceAlerts` table has a `notifySlackWebhook` column of type text, nullable
- `alertNotifications` table has a `channel` column of type varchar with default value 'email'
- Schema tests assert the presence of `notifySlackWebhook` on `users` and `priceAlerts`, and `channel` on `alertNotifications`

### session-001-step-002: Create AES-256-GCM encryption utility
**Description:** Create packages/api/src/lib/encryption.ts exporting `encrypt(plaintext: string): string` and `decrypt(ciphertext: string): string` functions using AES-256-GCM with the `SLACK_ENCRYPTION_KEY` environment variable. The ciphertext format should encode the IV and auth tag alongside the encrypted data.
**Files:** packages/api/src/lib/encryption.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `encrypt` returns a string that can be round-tripped through `decrypt` to recover the original plaintext
- `encrypt` produces different ciphertext for each call (random IV)
- `decrypt` throws on tampered ciphertext (GCM authentication)
- Functions read the encryption key from `process.env.SLACK_ENCRYPTION_KEY`
- Key must be exactly 32 bytes (256 bits) when decoded

### session-001-step-003: Add SLACK_ENCRYPTION_KEY to .env.example
**Description:** Add a `SLACK_ENCRYPTION_KEY` entry to .env.example under a new Slack section with a placeholder value and comment explaining it must be a 32-byte hex-encoded key.
**Files:** .env.example
**Complexity:** simple
**Acceptance Criteria:**
- `.env.example` contains a `SLACK_ENCRYPTION_KEY` entry
- A comment explains the key must be 32 bytes (64 hex characters)