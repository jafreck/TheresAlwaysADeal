import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/password.js";

describe("hashPassword", () => {
  it("should return a bcrypt hash string", async () => {
    const hash = await hashPassword("my-secret");
    expect(hash).toMatch(/^\$2[aby]?\$/);
  });

  it("should produce different hashes for the same input (salt)", async () => {
    const h1 = await hashPassword("same-password");
    const h2 = await hashPassword("same-password");
    expect(h1).not.toBe(h2);
  });
});

describe("verifyPassword", () => {
  it("should return true for a matching plaintext and hash", async () => {
    const hash = await hashPassword("correct-password");
    const result = await verifyPassword("correct-password", hash);
    expect(result).toBe(true);
  });

  it("should return false for a non-matching plaintext", async () => {
    const hash = await hashPassword("correct-password");
    const result = await verifyPassword("wrong-password", hash);
    expect(result).toBe(false);
  });

  it("should return false for an empty plaintext against a valid hash", async () => {
    const hash = await hashPassword("some-password");
    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });
});
