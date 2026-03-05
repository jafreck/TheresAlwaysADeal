import { describe, it, expect, vi } from "vitest";

// Mock @taad/email so the re-export is testable without real Resend/DB
const mockSendVerification = vi.fn();
const mockSendPasswordReset = vi.fn();
vi.mock("@taad/email", () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerification(...args),
  sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordReset(...args),
}));

import { sendVerificationEmail, sendPasswordResetEmail } from "../../src/lib/email.js";

describe("email re-exports from @taad/email", () => {
  it("should export sendVerificationEmail as a function", () => {
    expect(typeof sendVerificationEmail).toBe("function");
  });

  it("should export sendPasswordResetEmail as a function", () => {
    expect(typeof sendPasswordResetEmail).toBe("function");
  });

  it("sendVerificationEmail should delegate to @taad/email", async () => {
    await sendVerificationEmail("user@example.com", "abc123");
    expect(mockSendVerification).toHaveBeenCalledWith("user@example.com", "abc123");
  });

  it("sendPasswordResetEmail should delegate to @taad/email", async () => {
    await sendPasswordResetEmail("user@example.com", "reset-tok");
    expect(mockSendPasswordReset).toHaveBeenCalledWith("user@example.com", "reset-tok");
  });
});
