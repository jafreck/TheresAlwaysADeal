import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/lib/jwt.js";

const TEST_JWT_SECRET = "test-jwt-secret-that-is-long-enough";
const TEST_JWT_REFRESH_SECRET = "test-jwt-refresh-secret-that-is-long-enough";

describe("JWT utilities", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = TEST_JWT_REFRESH_SECRET;
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  describe("signAccessToken", () => {
    it("should return a JWT string with three dot-separated parts", async () => {
      const token = await signAccessToken("user-123");
      const parts = token.split(".");
      expect(parts).toHaveLength(3);
    });

    it("should throw when JWT_SECRET is not set", async () => {
      delete process.env.JWT_SECRET;
      await expect(signAccessToken("user-123")).rejects.toThrow(
        "Missing environment variable: JWT_SECRET",
      );
    });
  });

  describe("signRefreshToken", () => {
    it("should return a JWT string", async () => {
      const token = await signRefreshToken("user-456");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should throw when JWT_REFRESH_SECRET is not set", async () => {
      delete process.env.JWT_REFRESH_SECRET;
      await expect(signRefreshToken("user-456")).rejects.toThrow(
        "Missing environment variable: JWT_REFRESH_SECRET",
      );
    });
  });

  describe("verifyAccessToken", () => {
    it("should decode a valid access token with correct claims", async () => {
      const token = await signAccessToken("user-789");
      const payload = await verifyAccessToken(token);
      expect(payload.sub).toBe("user-789");
      expect(payload.type).toBe("access");
      expect(payload.exp).toBeTypeOf("number");
    });

    it("should reject a tampered token", async () => {
      const token = await signAccessToken("user-789");
      const tampered = token.slice(0, -4) + "XXXX";
      await expect(verifyAccessToken(tampered)).rejects.toThrow();
    });

    it("should reject a refresh token used as an access token", async () => {
      const refreshToken = await signRefreshToken("user-789");
      // Refresh tokens are signed with a different secret, so verification should fail
      await expect(verifyAccessToken(refreshToken)).rejects.toThrow();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should decode a valid refresh token with correct claims", async () => {
      const token = await signRefreshToken("user-abc");
      const payload = await verifyRefreshToken(token);
      expect(payload.sub).toBe("user-abc");
      expect(payload.type).toBe("refresh");
      expect(payload.exp).toBeTypeOf("number");
    });

    it("should reject a tampered token", async () => {
      const token = await signRefreshToken("user-abc");
      const tampered = token.slice(0, -4) + "XXXX";
      await expect(verifyRefreshToken(tampered)).rejects.toThrow();
    });

    it("should reject an access token used as a refresh token", async () => {
      const accessToken = await signAccessToken("user-abc");
      await expect(verifyRefreshToken(accessToken)).rejects.toThrow();
    });
  });
});
