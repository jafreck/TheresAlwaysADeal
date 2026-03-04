import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomBytes } from "node:crypto";

// Valid 32-byte key as 64 hex characters
const TEST_KEY = randomBytes(32).toString("hex");

describe("encrypt", () => {
  let encrypt: typeof import("../../src/lib/encryption.js").encrypt;

  beforeEach(async () => {
    process.env.SLACK_ENCRYPTION_KEY = TEST_KEY;
    // Re-import to pick up env changes
    const mod = await import("../../src/lib/encryption.js");
    encrypt = mod.encrypt;
  });

  afterEach(() => {
    delete process.env.SLACK_ENCRYPTION_KEY;
  });

  it("should return a hex-encoded string", () => {
    const result = encrypt("hello");
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it("should produce output longer than the input (iv + authTag + ciphertext)", () => {
    const result = encrypt("hi");
    // 12-byte IV + 16-byte authTag = 28 bytes min overhead = 56 hex chars
    expect(result.length).toBeGreaterThanOrEqual(56);
  });

  it("should produce different ciphertexts for the same plaintext (random IV)", () => {
    const a = encrypt("same-text");
    const b = encrypt("same-text");
    expect(a).not.toBe(b);
  });

  it("should throw when SLACK_ENCRYPTION_KEY is not set", async () => {
    delete process.env.SLACK_ENCRYPTION_KEY;
    // Re-import to get fresh reference
    const mod = await import("../../src/lib/encryption.js");
    expect(() => mod.encrypt("test")).toThrow("SLACK_ENCRYPTION_KEY environment variable is not set");
  });

  it("should throw when SLACK_ENCRYPTION_KEY is not 32 bytes", async () => {
    process.env.SLACK_ENCRYPTION_KEY = "abcd";
    const mod = await import("../../src/lib/encryption.js");
    expect(() => mod.encrypt("test")).toThrow("SLACK_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)");
  });
});

describe("decrypt", () => {
  let encrypt: typeof import("../../src/lib/encryption.js").encrypt;
  let decrypt: typeof import("../../src/lib/encryption.js").decrypt;

  beforeEach(async () => {
    process.env.SLACK_ENCRYPTION_KEY = TEST_KEY;
    const mod = await import("../../src/lib/encryption.js");
    encrypt = mod.encrypt;
    decrypt = mod.decrypt;
  });

  afterEach(() => {
    delete process.env.SLACK_ENCRYPTION_KEY;
  });

  it("should decrypt an encrypted string back to the original plaintext", () => {
    const plaintext = "https://hooks.slack.com/services/T00000/B00000/XXXX";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should handle empty string encryption and decryption", () => {
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("should handle unicode text", () => {
    const plaintext = "héllo wörld 🎮";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should handle long plaintext", () => {
    const plaintext = "a".repeat(10000);
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should throw when ciphertext is tampered with", () => {
    const encrypted = encrypt("secret");
    // Tamper with the last byte of the ciphertext
    const tampered =
      encrypted.slice(0, -2) +
      (encrypted.slice(-2) === "00" ? "ff" : "00");
    expect(() => decrypt(tampered)).toThrow();
  });

  it("should throw when SLACK_ENCRYPTION_KEY is not set", async () => {
    const encrypted = encrypt("test");
    delete process.env.SLACK_ENCRYPTION_KEY;
    const mod = await import("../../src/lib/encryption.js");
    expect(() => mod.decrypt(encrypted)).toThrow("SLACK_ENCRYPTION_KEY environment variable is not set");
  });
});
