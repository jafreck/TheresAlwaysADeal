import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks (available inside vi.mock factories) ──────────────────────

const {
  mockSelectResult,
  mockInsertResult,
  mockUpdateResult,
  mockSignAccessToken,
  mockSignRefreshToken,
  mockVerifyRefreshToken,
  mockHashPassword,
  mockVerifyPassword,
  mockRedisIncr,
  mockRedisExpire,
  mockRedisGet,
  mockDb,
  createSelectBuilder,
} = vi.hoisted(() => {
  // vi.fn() is available inside vi.hoisted in vitest 2.x
  // But we can't import vi here. We'll use simple tracking objects.
  // Instead, we return plain data and use vi.fn() outside for mock functions.
  const mockSelectResult: any[] = [];
  const mockInsertResult: any[] = [];
  const mockUpdateResult: any[] = [];

  function createSelectBuilder() {
    const builder: any = {
      from: () => builder,
      where: () => builder,
      limit: () => Promise.resolve([...mockSelectResult]),
      then: (resolve: (v: any) => any, reject?: (e: any) => any) =>
        Promise.resolve([...mockSelectResult]).then(resolve, reject),
    };
    return builder;
  }

  function createInsertBuilder() {
    const builder: any = {
      values: () => builder,
      returning: () => Promise.resolve([...mockInsertResult]),
      then: (resolve: (v: any) => any, reject?: (e: any) => any) =>
        Promise.resolve([...mockInsertResult]).then(resolve, reject),
    };
    return builder;
  }

  function createUpdateBuilder() {
    const builder: any = {
      set: () => builder,
      where: () => Promise.resolve([...mockUpdateResult]),
      then: (resolve: (v: any) => any, reject?: (e: any) => any) =>
        Promise.resolve([...mockUpdateResult]).then(resolve, reject),
    };
    return builder;
  }

  // Track calls manually since vi.fn() isn't directly available inside vi.hoisted
  function createMock(defaultImpl?: (...a: any[]) => any) {
    let resolveVal: any;
    let rejectVal: any;
    let mode: "none" | "resolve" | "reject" = "none";
    let callCount = 0;
    let lastArgs: any[] = [];
    const returnOnceQueue: any[] = [];

    const mock: any = (...args: any[]) => {
      callCount++;
      lastArgs = args;
      if (returnOnceQueue.length > 0) return returnOnceQueue.shift();
      if (mode === "resolve") return Promise.resolve(resolveVal);
      if (mode === "reject") return Promise.reject(rejectVal);
      return defaultImpl?.(...args);
    };
    mock.mockResolvedValue = (v: any) => { mode = "resolve"; resolveVal = v; return mock; };
    mock.mockRejectedValue = (v: any) => { mode = "reject"; rejectVal = v; return mock; };
    mock.mockReturnValueOnce = (v: any) => { returnOnceQueue.push(v); return mock; };
    mock.mockReset = () => { callCount = 0; lastArgs = []; mode = "none"; returnOnceQueue.length = 0; };
    mock.mockClear = () => { callCount = 0; lastArgs = []; };
    mock.getCallCount = () => callCount;
    mock.getLastArgs = () => lastArgs;
    return mock;
  }

  const mockSignAccessToken = createMock();
  const mockSignRefreshToken = createMock();
  const mockVerifyRefreshToken = createMock();
  const mockHashPassword = createMock();
  const mockVerifyPassword = createMock();
  const mockRedisIncr = createMock();
  const mockRedisExpire = createMock();
  const mockRedisGet = createMock();

  const mockDb = {
    select: createMock(() => createSelectBuilder()),
    insert: createMock(() => createInsertBuilder()),
    update: createMock(() => createUpdateBuilder()),
  };

  return {
    mockSelectResult,
    mockInsertResult,
    mockUpdateResult,
    mockSignAccessToken,
    mockSignRefreshToken,
    mockVerifyRefreshToken,
    mockHashPassword,
    mockVerifyPassword,
    mockRedisIncr,
    mockRedisExpire,
    mockRedisGet,
    mockDb,
    createSelectBuilder,
  };
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@taad/db", () => ({
  db: mockDb,
  users: {
    id: "id",
    email: "email",
    name: "name",
    passwordHash: "password_hash",
    emailVerified: "email_verified",
  },
  refreshTokens: {
    id: "id",
    userId: "user_id",
    token: "token",
    revokedAt: "revoked_at",
    expiresAt: "expires_at",
  },
  passwordResetTokens: {
    id: "id",
    userId: "user_id",
    token: "token",
    expiresAt: "expires_at",
    usedAt: "used_at",
  },
  emailVerificationTokens: {
    id: "id",
    userId: "user_id",
    token: "token",
    expiresAt: "expires_at",
    usedAt: "used_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col: any, val: any) => ({ op: "eq", val })),
  and: vi.fn((...args: any[]) => ({ op: "and", args })),
  isNull: vi.fn((col: any) => ({ op: "isNull", col })),
}));

vi.mock("../../src/lib/jwt.js", () => ({
  signAccessToken: (...args: any[]) => mockSignAccessToken(...args),
  signRefreshToken: (...args: any[]) => mockSignRefreshToken(...args),
  verifyRefreshToken: (...args: any[]) => mockVerifyRefreshToken(...args),
}));

vi.mock("../../src/lib/password.js", () => ({
  hashPassword: (...args: any[]) => mockHashPassword(...args),
  verifyPassword: (...args: any[]) => mockVerifyPassword(...args),
}));

vi.mock("../../src/middleware/rate-limit.js", () => ({
  rateLimit: vi.fn(() => vi.fn((_c: any, next: any) => next())),
}));

vi.mock("ioredis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    incr: mockRedisIncr,
    expire: mockRedisExpire,
    get: mockRedisGet,
  })),
}));

// ─── Import module under test ────────────────────────────────────────────────

import { auth } from "../../src/routes/auth.js";
import { Hono } from "hono";

// ─── Test App Setup ──────────────────────────────────────────────────────────

const app = new Hono().route("/auth", auth);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonRequest(method: string, path: string, body?: any, opts?: { cookie?: string }) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts?.cookie) headers["Cookie"] = opts.cookie;
  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new Request(`http://localhost${path}`, init);
}

function getRequest(path: string, opts?: { cookie?: string }) {
  const headers: Record<string, string> = {};
  if (opts?.cookie) headers["Cookie"] = opts.cookie;
  return new Request(`http://localhost${path}`, { method: "GET", headers });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("auth routes", () => {
  beforeEach(() => {
    mockSignAccessToken.mockReset();
    mockSignRefreshToken.mockReset();
    mockVerifyRefreshToken.mockReset();
    mockHashPassword.mockReset();
    mockVerifyPassword.mockReset();
    mockRedisIncr.mockReset();
    mockRedisExpire.mockReset();
    mockRedisGet.mockReset();
    mockDb.select.mockReset();
    mockDb.insert.mockReset();
    mockDb.update.mockReset();
    mockSelectResult.length = 0;
    mockInsertResult.length = 0;
    mockUpdateResult.length = 0;
    mockRedisIncr.mockResolvedValue(1);
    mockRedisExpire.mockResolvedValue(1);
    mockRedisGet.mockResolvedValue(null);
    delete process.env.REDIS_URL;
  });

  // ── POST /auth/register ──────────────────────────────────────────────────

  describe("POST /auth/register", () => {
    const validBody = { email: "test@example.com", password: "Password1" };

    it("should return 400 for invalid email", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/register", { email: "bad", password: "Password1" }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Validation failed");
    });

    it("should return 400 for password missing uppercase", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/register", { email: "a@b.com", password: "password1" }));
      expect(res.status).toBe(400);
    });

    it("should return 400 for password missing lowercase", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/register", { email: "a@b.com", password: "PASSWORD1" }));
      expect(res.status).toBe(400);
    });

    it("should return 400 for password missing number", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/register", { email: "a@b.com", password: "Password" }));
      expect(res.status).toBe(400);
    });

    it("should return 400 for password shorter than 8 characters", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/register", { email: "a@b.com", password: "Pass1" }));
      expect(res.status).toBe(400);
    });

    it("should return 409 if email already exists", async () => {
      mockSelectResult.push({ id: "existing-id" });

      const res = await app.request(jsonRequest("POST", "/auth/register", validBody));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe("Email already exists");
    });

    it("should return 201 with accessToken on successful registration", async () => {
      // First select: no existing user
      mockDb.select.mockReturnValueOnce(createSelectBuilder());
      // Insert user returns id
      mockInsertResult.push({ id: "new-user-id" });
      mockHashPassword.mockResolvedValue("hashed-password");
      mockSignAccessToken.mockResolvedValue("access-token-123");
      mockSignRefreshToken.mockResolvedValue("refresh-token-456");

      const res = await app.request(jsonRequest("POST", "/auth/register", validBody));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.accessToken).toBe("access-token-123");
    });

    it("should set refresh token as HttpOnly cookie on registration", async () => {
      mockDb.select.mockReturnValueOnce(createSelectBuilder());
      mockInsertResult.push({ id: "new-user-id" });
      mockHashPassword.mockResolvedValue("hashed-password");
      mockSignAccessToken.mockResolvedValue("access-token");
      mockSignRefreshToken.mockResolvedValue("refresh-token-value");

      const res = await app.request(jsonRequest("POST", "/auth/register", validBody));
      expect(res.status).toBe(201);
      const setCookieHeader = res.headers.get("set-cookie");
      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain("refresh_token=refresh-token-value");
      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("SameSite=Strict");
    });

    it("should hash the password before storing", async () => {
      mockDb.select.mockReturnValueOnce(createSelectBuilder());
      mockInsertResult.push({ id: "uid" });
      mockHashPassword.mockResolvedValue("hashed");
      mockSignAccessToken.mockResolvedValue("at");
      mockSignRefreshToken.mockResolvedValue("rt");

      await app.request(jsonRequest("POST", "/auth/register", validBody));
      expect(mockHashPassword.getCallCount()).toBeGreaterThan(0);
      expect(mockHashPassword.getLastArgs()).toEqual(["Password1"]);
    });

    it("should create an email verification token", async () => {
      mockDb.select.mockReturnValueOnce(createSelectBuilder());
      mockInsertResult.push({ id: "uid" });
      mockHashPassword.mockResolvedValue("hashed");
      mockSignAccessToken.mockResolvedValue("at");
      mockSignRefreshToken.mockResolvedValue("rt");

      await app.request(jsonRequest("POST", "/auth/register", validBody));
      // db.insert called for: user, emailVerificationTokens, refreshTokens
      expect(mockDb.insert.getCallCount()).toBe(3);
    });

    it("should accept optional name field", async () => {
      mockDb.select.mockReturnValueOnce(createSelectBuilder());
      mockInsertResult.push({ id: "uid" });
      mockHashPassword.mockResolvedValue("hashed");
      mockSignAccessToken.mockResolvedValue("at");
      mockSignRefreshToken.mockResolvedValue("rt");

      const res = await app.request(jsonRequest("POST", "/auth/register", { ...validBody, name: "Test User" }));
      expect(res.status).toBe(201);
    });
  });

  // ── POST /auth/login ─────────────────────────────────────────────────────

  describe("POST /auth/login", () => {
    const validBody = { email: "test@example.com", password: "Password1" };

    it("should return 400 for invalid email", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/login", { email: "bad", password: "x" }));
      expect(res.status).toBe(400);
    });

    it("should return 400 for empty password", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/login", { email: "a@b.com", password: "" }));
      expect(res.status).toBe(400);
    });

    it("should return 401 when user not found", async () => {
      // select returns empty
      const res = await app.request(jsonRequest("POST", "/auth/login", validBody));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid credentials");
    });

    it("should return 401 when password is incorrect", async () => {
      mockSelectResult.push({ id: "user-1", passwordHash: "some-hash" });
      mockVerifyPassword.mockResolvedValue(false);

      const res = await app.request(jsonRequest("POST", "/auth/login", validBody));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid credentials");
    });

    it("should return 200 with accessToken on successful login", async () => {
      mockSelectResult.push({ id: "user-1", passwordHash: "some-hash" });
      mockVerifyPassword.mockResolvedValue(true);
      mockSignAccessToken.mockResolvedValue("access-token-login");
      mockSignRefreshToken.mockResolvedValue("refresh-token-login");

      const res = await app.request(jsonRequest("POST", "/auth/login", validBody));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.accessToken).toBe("access-token-login");
    });

    it("should set refresh token cookie on successful login", async () => {
      mockSelectResult.push({ id: "user-1", passwordHash: "some-hash" });
      mockVerifyPassword.mockResolvedValue(true);
      mockSignAccessToken.mockResolvedValue("at");
      mockSignRefreshToken.mockResolvedValue("rt-value");

      const res = await app.request(jsonRequest("POST", "/auth/login", validBody));
      const setCookieHeader = res.headers.get("set-cookie");
      expect(setCookieHeader).toContain("refresh_token=rt-value");
      expect(setCookieHeader).toContain("HttpOnly");
    });

    it("should return 429 when brute-force limit is exceeded", async () => {
      process.env.REDIS_URL = "redis://localhost:6379";
      mockRedisGet.mockResolvedValue("11");

      // Need to re-import to pick up REDIS_URL
      vi.resetModules();
      const { auth: freshAuth } = await import("../../src/routes/auth.js");
      const freshApp = new (await import("hono")).Hono().route("/auth", freshAuth);

      const res = await freshApp.request(jsonRequest("POST", "/auth/login", validBody));
      expect(res.status).toBe(429);
    });

    it("should fail open when Redis is unavailable", async () => {
      // No REDIS_URL set, so Redis returns null => fail open
      mockSelectResult.push({ id: "user-1", passwordHash: "hash" });
      mockVerifyPassword.mockResolvedValue(true);
      mockSignAccessToken.mockResolvedValue("at");
      mockSignRefreshToken.mockResolvedValue("rt");

      const res = await app.request(jsonRequest("POST", "/auth/login", validBody));
      expect(res.status).toBe(200);
    });

    it("should return 401 when user has no password hash", async () => {
      mockSelectResult.push({ id: "user-1", passwordHash: null });

      const res = await app.request(jsonRequest("POST", "/auth/login", validBody));
      expect(res.status).toBe(401);
    });
  });

  // ── POST /auth/refresh ───────────────────────────────────────────────────

  describe("POST /auth/refresh", () => {
    it("should return 401 when no refresh token cookie", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/refresh"));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("No refresh token");
    });

    it("should return 401 when refresh token is invalid", async () => {
      mockVerifyRefreshToken.mockRejectedValue(new Error("Invalid token"));

      const res = await app.request(jsonRequest("POST", "/auth/refresh", undefined, {
        cookie: "refresh_token=invalid-token",
      }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid or expired refresh token");
    });

    it("should return 401 when refresh token is revoked in DB", async () => {
      mockVerifyRefreshToken.mockResolvedValue({ sub: "user-1", type: "refresh" });
      // select returns empty (token not found or revoked)

      const res = await app.request(jsonRequest("POST", "/auth/refresh", undefined, {
        cookie: "refresh_token=revoked-token",
      }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Refresh token revoked or not found");
    });

    it("should return 200 with new accessToken on valid refresh", async () => {
      mockVerifyRefreshToken.mockResolvedValue({ sub: "user-1", type: "refresh" });
      mockSelectResult.push({ id: "token-id", revokedAt: null });
      mockSignAccessToken.mockResolvedValue("new-access-token");

      const res = await app.request(jsonRequest("POST", "/auth/refresh", undefined, {
        cookie: "refresh_token=valid-token",
      }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.accessToken).toBe("new-access-token");
    });
  });

  // ── POST /auth/logout ────────────────────────────────────────────────────

  describe("POST /auth/logout", () => {
    it("should return 200 even without a refresh token cookie", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/logout"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Logged out");
    });

    it("should revoke refresh token in DB when cookie present", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/logout", undefined, {
        cookie: "refresh_token=some-token",
      }));
      expect(res.status).toBe(200);
      expect(mockDb.update.getCallCount()).toBeGreaterThan(0);
    });

    it("should clear the refresh token cookie", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/logout", undefined, {
        cookie: "refresh_token=some-token",
      }));
      const setCookieHeader = res.headers.get("set-cookie");
      expect(setCookieHeader).toContain("refresh_token=");
    });
  });

  // ── POST /auth/forgot-password ───────────────────────────────────────────

  describe("POST /auth/forgot-password", () => {
    it("should return 400 for invalid email", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/forgot-password", { email: "invalid" }));
      expect(res.status).toBe(400);
    });

    it("should return 200 even when email does not exist (no user enumeration)", async () => {
      // select returns empty — no user found
      const res = await app.request(jsonRequest("POST", "/auth/forgot-password", { email: "noone@example.com" }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toContain("If the email exists");
    });

    it("should return 200 and create reset token when email exists", async () => {
      mockSelectResult.push({ id: "user-1" });

      const res = await app.request(jsonRequest("POST", "/auth/forgot-password", { email: "exists@example.com" }));
      expect(res.status).toBe(200);
      expect(mockDb.insert.getCallCount()).toBeGreaterThan(0);
    });

    it("should not insert reset token when user does not exist", async () => {
      // select returns empty
      await app.request(jsonRequest("POST", "/auth/forgot-password", { email: "nope@example.com" }));
      expect(mockDb.insert.getCallCount()).toBe(0);
    });
  });

  // ── POST /auth/reset-password ────────────────────────────────────────────

  describe("POST /auth/reset-password", () => {
    const validBody = { token: "valid-reset-token", password: "NewPass1!" };

    it("should return 400 for invalid password format", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/reset-password", { token: "t", password: "weak" }));
      expect(res.status).toBe(400);
    });

    it("should return 400 for empty token", async () => {
      const res = await app.request(jsonRequest("POST", "/auth/reset-password", { token: "", password: "Password1" }));
      expect(res.status).toBe(400);
    });

    it("should return 400 when token not found in DB", async () => {
      // select returns empty
      const res = await app.request(jsonRequest("POST", "/auth/reset-password", validBody));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid or expired reset token");
    });

    it("should return 400 when token is already used", async () => {
      mockSelectResult.push({
        id: "reset-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60000),
        usedAt: new Date(),
      });

      const res = await app.request(jsonRequest("POST", "/auth/reset-password", validBody));
      expect(res.status).toBe(400);
    });

    it("should return 400 when token is expired", async () => {
      mockSelectResult.push({
        id: "reset-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() - 60000),
        usedAt: null,
      });

      const res = await app.request(jsonRequest("POST", "/auth/reset-password", validBody));
      expect(res.status).toBe(400);
    });

    it("should return 200 and update password for valid token", async () => {
      mockSelectResult.push({
        id: "reset-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60000),
        usedAt: null,
      });
      mockHashPassword.mockResolvedValue("new-hashed-password");

      const res = await app.request(jsonRequest("POST", "/auth/reset-password", validBody));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Password has been reset");
    });

    it("should hash new password and mark token as used", async () => {
      mockSelectResult.push({
        id: "reset-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60000),
        usedAt: null,
      });
      mockHashPassword.mockResolvedValue("new-hash");

      await app.request(jsonRequest("POST", "/auth/reset-password", validBody));
      expect(mockHashPassword.getCallCount()).toBeGreaterThan(0);
      expect(mockHashPassword.getLastArgs()).toEqual(["NewPass1!"]);
      // update called twice: once for user password, once for marking token used
      expect(mockDb.update.getCallCount()).toBe(2);
    });
  });

  // ── GET /auth/verify-email ───────────────────────────────────────────────

  describe("GET /auth/verify-email", () => {
    it("should return 400 when no token query param", async () => {
      const res = await app.request(getRequest("/auth/verify-email"));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Token is required");
    });

    it("should return 400 when token not found in DB", async () => {
      // select returns empty
      const res = await app.request(getRequest("/auth/verify-email?token=unknown"));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid or expired verification token");
    });

    it("should return 400 when token is already used", async () => {
      mockSelectResult.push({
        id: "ev-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60000),
        usedAt: new Date(),
      });

      const res = await app.request(getRequest("/auth/verify-email?token=used"));
      expect(res.status).toBe(400);
    });

    it("should return 400 when token is expired", async () => {
      mockSelectResult.push({
        id: "ev-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() - 60000),
        usedAt: null,
      });

      const res = await app.request(getRequest("/auth/verify-email?token=expired"));
      expect(res.status).toBe(400);
    });

    it("should return 200 and verify email for valid token", async () => {
      mockSelectResult.push({
        id: "ev-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60000),
        usedAt: null,
      });

      const res = await app.request(getRequest("/auth/verify-email?token=valid"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Email verified successfully");
    });

    it("should update user emailVerified and mark token as used", async () => {
      mockSelectResult.push({
        id: "ev-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60000),
        usedAt: null,
      });

      await app.request(getRequest("/auth/verify-email?token=valid"));
      // update called twice: user emailVerified + token usedAt
      expect(mockDb.update.getCallCount()).toBe(2);
    });
  });
});
