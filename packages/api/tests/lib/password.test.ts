import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/password.js";

describe("hashPassword", () => {
  it("should return a bcrypt hash string", async () => {
    const hash = await hashPassword("my-password");
    expect(hash).toMatch(/^\$2[aby]?\$/);
  });

  it("should use cost factor 12", async () => {
    const hash = await hashPassword("test");
    // bcrypt hash format: $2a$12$...
    expect(hash).toMatch(/^\$2[aby]?\$12\$/);
  });

  it("should produce different hashes for the same input", async () => {
    const hash1 = await hashPassword("same");
    const hash2 = await hashPassword("same");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("should return true for a correct password", async () => {
    const hash = await hashPassword("correct");
    const result = await verifyPassword("correct", hash);
    expect(result).toBe(true);
  });

  it("should return false for an incorrect password", async () => {
    const hash = await hashPassword("correct");
    const result = await verifyPassword("wrong", hash);
    expect(result).toBe(false);
  });

  it("should return false for an empty password against a real hash", async () => {
    const hash = await hashPassword("nonempty");
    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });
});
