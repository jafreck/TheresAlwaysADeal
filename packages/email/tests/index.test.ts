import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
vi.mock("@taad/db", () => ({
  db: { insert: (...args: unknown[]) => mockInsert(...args) },
  alertNotifications: Symbol("alertNotifications"),
}));

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPriceAlert,
} from "../src/index.js";
import type { PriceAlertData } from "../src/index.js";

describe("sendVerificationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "test@example.com";
    process.env.APP_URL = "https://app.example.com";
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.APP_URL;
  });

  it("should send a verification email via Resend", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "msg_1" } });
    await sendVerificationEmail("user@test.com", "token123");

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("user@test.com");
    expect(call.from).toBe("test@example.com");
    expect(call.subject).toContain("Verify your email");
    expect(call.html).toContain("https://app.example.com/api/auth/verify-email?token=token123");
  });

  it("should use default APP_URL when not set", async () => {
    delete process.env.APP_URL;
    mockSend.mockResolvedValueOnce({ data: { id: "msg_2" } });
    await sendVerificationEmail("user@test.com", "tok");

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("http://localhost:3000/api/auth/verify-email?token=tok");
  });

  it("should use default EMAIL_FROM when not set", async () => {
    delete process.env.EMAIL_FROM;
    mockSend.mockResolvedValueOnce({ data: { id: "msg_3" } });
    await sendVerificationEmail("user@test.com", "tok");

    const call = mockSend.mock.calls[0][0];
    expect(call.from).toBe("noreply@theres-always-a-deal.com");
  });

  it("should not throw when Resend SDK throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("SDK error"));
    await expect(sendVerificationEmail("user@test.com", "tok")).resolves.toBeUndefined();
  });

  it("should throw when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(sendVerificationEmail("user@test.com", "tok")).rejects.toThrow(
      "RESEND_API_KEY environment variable is required",
    );
  });
});

describe("sendPasswordResetEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "test@example.com";
    process.env.APP_URL = "https://app.example.com";
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.APP_URL;
  });

  it("should send a password reset email via Resend", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "msg_4" } });
    await sendPasswordResetEmail("user@test.com", "reset_tok");

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("user@test.com");
    expect(call.subject).toContain("Reset your password");
    expect(call.html).toContain("https://app.example.com/api/auth/reset-password?token=reset_tok");
  });

  it("should not throw when Resend SDK throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("SDK error"));
    await expect(sendPasswordResetEmail("user@test.com", "tok")).resolves.toBeUndefined();
  });

  it("should throw when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(sendPasswordResetEmail("user@test.com", "tok")).rejects.toThrow(
      "RESEND_API_KEY environment variable is required",
    );
  });
});

describe("sendPriceAlert", () => {
  const priceData: PriceAlertData = {
    gameTitle: "Test Game",
    imageUrl: "https://cdn.example.com/img.jpg",
    prices: [
      { storeName: "Steam", price: "19.99", referralUrl: "https://steam.com/app/1?ref=taad" },
    ],
    unsubscribeUrl: "https://example.com/unsub?token=abc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "test@example.com";
    // Reset the mock insert chain
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it("should send a price alert email and log success to DB", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "msg_price_1" } });

    await sendPriceAlert("user-1", "alert-1", priceData, "user@test.com", "listing-1", "19.99");

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("user@test.com");
    expect(call.subject).toContain("Price drop: Test Game");
    expect(call.html).toContain("Test Game");

    // Should log success to alertNotifications
    expect(mockInsert).toHaveBeenCalledOnce();
    const insertValues = mockInsert.mock.results[0].value.values;
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        alertId: "alert-1",
        storeListingId: "listing-1",
        triggeredPrice: "19.99",
        emailStatus: "sent",
        emailMessageId: "msg_price_1",
        emailProvider: "resend",
      }),
    );
  });

  it("should log failure to DB when Resend SDK throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("Send failed"));

    await sendPriceAlert("user-1", "alert-1", priceData, "user@test.com", "listing-1", "19.99");

    expect(mockInsert).toHaveBeenCalledOnce();
    const insertValues = mockInsert.mock.results[0].value.values;
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        alertId: "alert-1",
        emailStatus: "failed",
        emailMessageId: null,
        emailProvider: "resend",
      }),
    );
  });

  it("should not crash when both send and DB logging fail", async () => {
    mockSend.mockRejectedValueOnce(new Error("Send failed"));
    mockInsert.mockReturnValueOnce({ values: vi.fn().mockRejectedValue(new Error("DB error")) });

    await expect(
      sendPriceAlert("user-1", "alert-1", priceData, "user@test.com", "listing-1", "19.99"),
    ).resolves.toBeUndefined();
  });

  it("should throw when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(
      sendPriceAlert("user-1", "alert-1", priceData, "user@test.com", "listing-1", "19.99"),
    ).rejects.toThrow("RESEND_API_KEY environment variable is required");
  });

  it("should handle null message ID from Resend response", async () => {
    mockSend.mockResolvedValueOnce({ data: null });

    await sendPriceAlert("user-1", "alert-1", priceData, "user@test.com", "listing-1", "19.99");

    const insertValues = mockInsert.mock.results[0].value.values;
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        emailStatus: "sent",
        emailMessageId: null,
      }),
    );
  });
});
