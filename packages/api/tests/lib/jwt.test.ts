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

const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } =
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
