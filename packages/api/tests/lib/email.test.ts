import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../src/lib/email.js";

describe("sendVerificationEmail", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.APP_URL;
  });

  it("should log a verification URL containing the token", async () => {
    await sendVerificationEmail("user@example.com", "abc123");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("token=abc123"),
    );
  });

  it("should log the email address", async () => {
    await sendVerificationEmail("user@example.com", "tok");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("user@example.com"),
    );
  });

  it("should use the default APP_URL when env var is not set", async () => {
    await sendVerificationEmail("a@b.com", "t1");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("http://localhost:3000/api/auth/verify-email"),
    );
  });

  it("should use the APP_URL env var when set", async () => {
    process.env.APP_URL = "https://myapp.com";
    await sendVerificationEmail("a@b.com", "t2");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("https://myapp.com/api/auth/verify-email"),
    );
  });

  it("should resolve without throwing", async () => {
    await expect(sendVerificationEmail("a@b.com", "t")).resolves.toBeUndefined();
  });
});

describe("sendPasswordResetEmail", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.APP_URL;
  });

  it("should log a reset URL containing the token", async () => {
    await sendPasswordResetEmail("user@example.com", "reset-tok");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("token=reset-tok"),
    );
  });

  it("should log the email address", async () => {
    await sendPasswordResetEmail("user@example.com", "tok");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("user@example.com"),
    );
  });

  it("should use the default APP_URL when env var is not set", async () => {
    await sendPasswordResetEmail("a@b.com", "t1");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("http://localhost:3000/api/auth/reset-password"),
    );
  });

  it("should use the APP_URL env var when set", async () => {
    process.env.APP_URL = "https://production.app";
    await sendPasswordResetEmail("a@b.com", "t2");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("https://production.app/api/auth/reset-password"),
    );
  });

  it("should resolve without throwing", async () => {
    await expect(sendPasswordResetEmail("a@b.com", "t")).resolves.toBeUndefined();
  });
});
