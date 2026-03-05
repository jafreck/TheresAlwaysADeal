import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Set env vars before importing the module
beforeEach(() => {
  process.env.JWT_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

afterEach(() => {
  delete process.env.JWT_SECRET;
  delete process.env.JWT_REFRESH_SECRET;
  vi.resetModules();
});

const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, signUnsubscribeToken, verifyUnsubscribeToken } =
  await import("../../src/lib/jwt.js");

describe("signAccessToken", () => {
  it("should return a JWT string with three dot-separated parts", () => {
    const token = signAccessToken({ userId: "123" });
    expect(token.split(".")).toHaveLength(3);
  });

  it("should embed the payload in the token", () => {
    const token = signAccessToken({ userId: "abc", role: "admin" });
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe("abc");
    expect(decoded.role).toBe("admin");
  });
});

describe("verifyAccessToken", () => {
  it("should decode a valid access token", () => {
    const token = signAccessToken({ sub: "user-1" });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user-1");
    expect(payload.exp).toBeDefined();
    expect(payload.iat).toBeDefined();
  });

  it("should throw for a token signed with a different secret", () => {
    const token = signRefreshToken({ sub: "user-1" });
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("should throw for a malformed token", () => {
    expect(() => verifyAccessToken("not.a.token")).toThrow();
  });
});

describe("signRefreshToken", () => {
  it("should return a JWT string", () => {
    const token = signRefreshToken({ userId: "456" });
    expect(token.split(".")).toHaveLength(3);
  });

  it("should embed the payload in the token", () => {
    const token = signRefreshToken({ userId: "xyz" });
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe("xyz");
  });
});

describe("verifyRefreshToken", () => {
  it("should decode a valid refresh token", () => {
    const token = signRefreshToken({ sub: "user-2" });
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe("user-2");
    expect(payload.exp).toBeDefined();
  });

  it("should throw for a token signed with the access secret", () => {
    const token = signAccessToken({ sub: "user-2" });
    expect(() => verifyRefreshToken(token)).toThrow();
  });
});

describe("missing environment variables", () => {
  it("should throw when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;
    expect(() => signAccessToken({ id: "1" })).toThrow(
      "JWT_SECRET environment variable is required",
    );
  });

  it("should throw when JWT_REFRESH_SECRET is missing", async () => {
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => signRefreshToken({ id: "1" })).toThrow(
      "JWT_REFRESH_SECRET environment variable is required",
    );
  });
});

// ─── Unsubscribe Token tests ──────────────────────────────────────────────────

const jwtModule = await import("../../src/lib/jwt.js");

describe("signUnsubscribeToken", () => {
  it("should return a string with two dot-separated parts", () => {
    const token = jwtModule.signUnsubscribeToken("alert-123");
    expect(token.split(".")).toHaveLength(2);
  });

  it("should produce different tokens for different alertIds", () => {
    const t1 = jwtModule.signUnsubscribeToken("alert-1");
    const t2 = jwtModule.signUnsubscribeToken("alert-2");
    expect(t1).not.toBe(t2);
  });

  it("should produce the same token for the same alertId (deterministic HMAC)", () => {
    const t1 = jwtModule.signUnsubscribeToken("alert-same");
    const t2 = jwtModule.signUnsubscribeToken("alert-same");
    expect(t1).toBe(t2);
  });
});

describe("verifyUnsubscribeToken", () => {
  it("should return the alertId from a valid token", () => {
    const token = jwtModule.signUnsubscribeToken("alert-456");
    const result = jwtModule.verifyUnsubscribeToken(token);
    expect(result).toBe("alert-456");
  });

  it("should throw for a tampered payload", () => {
    const token = jwtModule.signUnsubscribeToken("alert-789");
    const [, signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ alertId: "alert-hacked" })).toString("base64url");
    expect(() => jwtModule.verifyUnsubscribeToken(`${tamperedPayload}.${signature}`)).toThrow("Invalid unsubscribe token");
  });

  it("should throw for a tampered signature", () => {
    const token = jwtModule.signUnsubscribeToken("alert-100");
    const [payload] = token.split(".");
    expect(() => jwtModule.verifyUnsubscribeToken(`${payload}.tampered-sig`)).toThrow("Invalid unsubscribe token");
  });

  it("should throw for a token with wrong number of parts", () => {
    expect(() => jwtModule.verifyUnsubscribeToken("only-one-part")).toThrow("Invalid unsubscribe token");
    expect(() => jwtModule.verifyUnsubscribeToken("a.b.c")).toThrow("Invalid unsubscribe token");
  });

  it("should throw for a token with empty alertId in payload", () => {
    const crypto = require("node:crypto");
    const payload = Buffer.from(JSON.stringify({ alertId: "" })).toString("base64url");
    const signature = crypto.createHmac("sha256", process.env.JWT_SECRET!).update(payload).digest("base64url");
    expect(() => jwtModule.verifyUnsubscribeToken(`${payload}.${signature}`)).toThrow("Invalid unsubscribe token");
  });
});

// ─── Unsubscribe Tokens (HMAC-SHA256) ─────────────────────────────────────────

describe("signUnsubscribeToken", () => {
  it("should return a string with two dot-separated parts", () => {
    const token = signUnsubscribeToken("alert-123");
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
  });

  it("should encode the alertId in the payload", () => {
    const token = signUnsubscribeToken("alert-abc");
    const [payload] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload!, "base64url").toString());
    expect(decoded.alertId).toBe("alert-abc");
  });

  it("should produce deterministic tokens for the same alertId", () => {
    const token1 = signUnsubscribeToken("alert-xyz");
    const token2 = signUnsubscribeToken("alert-xyz");
    expect(token1).toBe(token2);
  });

  it("should produce different tokens for different alertIds", () => {
    const token1 = signUnsubscribeToken("alert-1");
    const token2 = signUnsubscribeToken("alert-2");
    expect(token1).not.toBe(token2);
  });

  it("should throw when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    expect(() => signUnsubscribeToken("alert-1")).toThrow(
      "JWT_SECRET environment variable is required",
    );
  });
});

describe("verifyUnsubscribeToken", () => {
  it("should return the alertId from a valid token", () => {
    const token = signUnsubscribeToken("alert-456");
    const alertId = verifyUnsubscribeToken(token);
    expect(alertId).toBe("alert-456");
  });

  it("should throw for a tampered signature", () => {
    const token = signUnsubscribeToken("alert-789");
    const [payload] = token.split(".");
    const tampered = `${payload}.tampered-signature`;
    expect(() => verifyUnsubscribeToken(tampered)).toThrow("Invalid unsubscribe token");
  });

  it("should throw for a tampered payload", () => {
    const token = signUnsubscribeToken("alert-789");
    const [, signature] = token.split(".");
    const fakePayload = Buffer.from(JSON.stringify({ alertId: "hacked" })).toString("base64url");
    expect(() => verifyUnsubscribeToken(`${fakePayload}.${signature}`)).toThrow("Invalid unsubscribe token");
  });

  it("should throw for a token with no dot separator", () => {
    expect(() => verifyUnsubscribeToken("nodots")).toThrow("Invalid unsubscribe token");
  });

  it("should throw for a token with too many parts", () => {
    expect(() => verifyUnsubscribeToken("a.b.c")).toThrow("Invalid unsubscribe token");
  });

  it("should throw for a payload without alertId", () => {
    const payload = Buffer.from(JSON.stringify({ other: "data" })).toString("base64url");
    const crypto = require("node:crypto");
    const signature = crypto
      .createHmac("sha256", process.env.JWT_SECRET!)
      .update(payload)
      .digest("base64url");
    expect(() => verifyUnsubscribeToken(`${payload}.${signature}`)).toThrow("Invalid unsubscribe token");
  });

  it("should throw when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    expect(() => verifyUnsubscribeToken("some.token")).toThrow(
      "JWT_SECRET environment variable is required",
    );
  });
});
