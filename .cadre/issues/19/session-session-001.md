# Session: session-001 - Foundation: Schema, Validation, and Encryption

**Rationale:** These foundational changes (DB columns, Zod schemas, encryption utility, env config) are tightly coupled and must all exist before the API routes or worker evaluation logic can be built.
**Dependencies:** none

## Steps

### session-001-step-001: Expand priceAlerts schema with new columns
**Description:** Add storeId (nullable UUID FK to stores), targetDiscountPercent (decimal, nullable), notifyEmail (boolean, default true), and notifySlackWebhook (text, nullable) columns to the priceAlerts table. Make the existing targetPrice column nullable to support discount-only alerts.
**Files:** packages/db/src/schema.ts
**Complexity:** moderate
**Acceptance Criteria:**
- priceAlerts table has a nullable `storeId` column with a foreign key reference to `stores.id`
- priceAlerts table has a nullable `targetDiscountPercent` decimal(5,2) column
- priceAlerts table has a `notifyEmail` boolean column defaulting to true
- priceAlerts table has a nullable `notifySlackWebhook` text column
- The existing `targetPrice` column is now nullable (to allow discount-only alerts)
- All existing columns (id, userId, gameId, isActive, createdAt, updatedAt) are preserved unchanged

### session-001-step-002: Add Zod validation schemas for alert payloads
**Description:** Add createAlertSchema and updateAlertSchema Zod schemas in the validation module. The create schema requires gameId and at least one of targetPrice or targetDiscountPercent. The update schema makes all fields optional.
**Files:** packages/api/src/lib/validation.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `createAlertSchema` is exported and requires `gameId` (UUID string)
- `createAlertSchema` accepts optional `storeId` (UUID string), `targetPrice` (positive number), `targetDiscountPercent` (number 0-100), `notifyEmail` (boolean), `notifySlackWebhook` (string URL)
- `createAlertSchema` enforces that at least one of `targetPrice` or `targetDiscountPercent` is provided via a Zod refinement
- `updateAlertSchema` is exported and makes all fields optional (partial of create schema without gameId)
- Existing validation schemas are not modified

### session-001-step-003: Create encryption utility for Slack webhook
**Description:** Create a new encryption module that provides encrypt and decrypt functions using AES-256-GCM with the ENCRYPTION_KEY environment variable. This is used to store notifySlackWebhook encrypted at rest.
**Files:** packages/api/src/lib/encryption.ts
**Complexity:** moderate
**Acceptance Criteria:**
- `encrypt(plaintext: string): string` function is exported and returns a colon-separated string of iv:authTag:ciphertext (all hex-encoded)
- `decrypt(encrypted: string): string` function is exported and reverses the encryption
- Both functions use AES-256-GCM with a 32-byte key derived from the `ENCRYPTION_KEY` env var
- The module throws a clear error if `ENCRYPTION_KEY` is not set when encrypt/decrypt is called

### session-001-step-004: Add ENCRYPTION_KEY to .env.example
**Description:** Add an ENCRYPTION_KEY environment variable entry to .env.example under a new 'Encryption' section so developers know to configure it.
**Files:** .env.example
**Complexity:** simple
**Acceptance Criteria:**
- `.env.example` contains an `ENCRYPTION_KEY` entry with a placeholder value and a descriptive comment