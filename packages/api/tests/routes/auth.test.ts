import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

const mockHashPassword = vi.fn();
const mockVerifyPassword = vi.fn();
vi.mock("../../src/lib/password.js", () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));

const mockSignAccessToken = vi.fn();
const mockSignRefreshToken = vi.fn();
const mockVerifyRefreshToken = vi.fn();
vi.mock("../../src/lib/jwt.js", () => ({
  signAccessToken: (...args: unknown[]) => mockSignAccessToken(...args),
  signRefreshToken: (...args: unknown[]) => mockSignRefreshToken(...args),
  verifyRefreshToken: (...args: unknown[]) => mockVerifyRefreshToken(...args),
}));

const mockSendVerificationEmail = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
vi.mock("../../src/lib/email.js", () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
  sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
}));

// DB mock
let mockDbSelectResult: any[] = [];
let mockDbInsertResult: any[] = [];
let mockDbUpdateResult: any[] = [];

function createSelectBuilder() {
  const builder: any = {
    from: () => builder,
    where: () => builder,
    limit: () => Promise.resolve(mockDbSelectResult),
    then: (resolve: (v: any) => any, reject: (e: any) => any) =>
      Promise.resolve(mockDbSelectResult).then(resolve, reject),
  };
  return builder;
}

const mockDb = {
  select: vi.fn().mockReturnValue(createSelectBuilder()),
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockImplementation(() => Promise.resolve(mockDbInsertResult)),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockImplementation(() => Promise.resolve(mockDbUpdateResult)),
    }),
  }),
};

const stubTable = (cols: Record<string, string>) => cols;

vi.mock("@taad/db", () => ({
  db: mockDb,
  users: stubTable({
    id: "id",
    email: "email",
    passwordHash: "passwordHash",
    emailVerified: "emailVerified",
    emailVerificationToken: "emailVerificationToken",
    passwordResetToken: "passwordResetToken",
    passwordResetExpires: "passwordResetExpires",
  }),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: string, val: unknown) => ({ col, val })),
}));

// ─── App under test ───────────────────────────────────────────────────────────

const { createAuthApp } = await import("../../src/routes/auth.js");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockRedis() {
  return {
    set: vi.fn().mockResolvedValue("OK"),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  } as any;
}

function makeApp(redis: any = null) {
  return createAuthApp(() => redis);
}

function jsonRequest(app: any, path: string, body?: any, opts: RequestInit = {}) {
  return app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...opts.headers },
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("createAuthApp", () => {
  it("should return a Hono app", () => {
    const app = makeApp();
    expect(app).toBeDefined();
    expect(typeof app.request).toBe("function");
  });
});

describe("POST /register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbSelectResult = [];
    mockDbInsertResult = [{ id: "user-1", email: "test@example.com" }];
    mockHashPassword.mockResolvedValue("hashed");
    mockSignAccessToken.mockReturnValue("access-token");
    mockSignRefreshToken.mockReturnValue("refresh-token");
    mockSendVerificationEmail.mockResolvedValue(undefined);
    mockDb.select.mockReturnValue(createSelectBuilder());
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockImplementation(() => Promise.resolve(mockDbInsertResult)),
      }),
    });
  });

  it("should register a new user and return 201 with accessToken", async () => {
    const app = makeApp();
    const res = await jsonRequest(app, "/register", {
      email: "test@example.com",
      password: "securepassword",
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ accessToken: "access-token" });
    expect(mockHashPassword).toHaveBeenCalledWith("securepassword");
    expect(mockSendVerificationEmail).toHaveBeenCalled();
  });

  it("should return 400 for invalid input (missing password)", async () => {
    const app = makeApp();
    const res = await jsonRequest(app, "/register", { email: "test@example.com" });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
    expect(body.details).toBeDefined();
  });

  it("should return 400 for invalid email", async () => {
    const app = makeApp();
    const res = await jsonRequest(app, "/register", {
      email: "not-email",
      password: "securepassword",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
  });

  it("should return 400 for short password", async () => {
    const app = makeApp();
    const res = await jsonRequest(app, "/register", {
      email: "test@example.com",
      password: "short",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
  });

  it("should return 400 when email already registered", async () => {
    mockDbSelectResult = [{ id: "existing-user" }];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await jsonRequest(app, "/register", {
      email: "existing@example.com",
      password: "securepassword",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email already registered");
  });

  it("should store refresh token in Redis when available", async () => {
    const redis = createMockRedis();
    const app = makeApp(redis);
    await jsonRequest(app, "/register", {
      email: "test@example.com",
      password: "securepassword",
    });

    expect(redis.set).toHaveBeenCalledWith(
      "refresh:refresh-token",
      "user-1",
      "EX",
      expect.any(Number),
    );
  });

  it("should return 400 when user insert fails", async () => {
    mockDbInsertResult = [];
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockImplementation(() => Promise.resolve([])),
      }),
    });

    const app = makeApp();
    const res = await jsonRequest(app, "/register", {
      email: "test@example.com",
      password: "securepassword",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Failed to create user");
  });
});

describe("POST /login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbSelectResult = [
      { id: "user-1", email: "test@example.com", passwordHash: "hashed" },
    ];
    mockVerifyPassword.mockResolvedValue(true);
    mockSignAccessToken.mockReturnValue("access-token");
    mockSignRefreshToken.mockReturnValue("refresh-token");
    mockDb.select.mockReturnValue(createSelectBuilder());
  });

  it("should login and return 200 with accessToken", async () => {
    const app = makeApp();
    const res = await jsonRequest(app, "/login", {
      email: "test@example.com",
      password: "securepassword",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ accessToken: "access-token" });
  });

  it("should return 400 for invalid input", async () => {
    const app = makeApp();
    const res = await jsonRequest(app, "/login", { email: "bad" });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
  });

  it("should return 401 when user not found", async () => {
    mockDbSelectResult = [];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await jsonRequest(app, "/login", {
      email: "nouser@example.com",
      password: "securepassword",
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("should return 401 when password is invalid", async () => {
    mockVerifyPassword.mockResolvedValue(false);

    const app = makeApp();
    const res = await jsonRequest(app, "/login", {
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("should return 401 when user has no passwordHash", async () => {
    mockDbSelectResult = [{ id: "user-1", email: "test@example.com", passwordHash: null }];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await jsonRequest(app, "/login", {
      email: "test@example.com",
      password: "securepassword",
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("should store refresh token in Redis when available", async () => {
    const redis = createMockRedis();
    const app = makeApp(redis);
    await jsonRequest(app, "/login", {
      email: "test@example.com",
      password: "securepassword",
    });

    expect(redis.set).toHaveBeenCalledWith(
      "refresh:refresh-token",
      "user-1",
      "EX",
      expect.any(Number),
    );
  });

  it("should return 429 after too many login attempts (Redis)", async () => {
    const redis = createMockRedis();
    redis.incr.mockResolvedValue(11);
    const app = makeApp(redis);

    const res = await jsonRequest(app, "/login", {
      email: "test@example.com",
      password: "securepassword",
    });

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Too many login attempts");
  });

  it("should set expire on first brute-force key in Redis", async () => {
    const redis = createMockRedis();
    redis.incr.mockResolvedValue(1);
    const app = makeApp(redis);

    await jsonRequest(app, "/login", {
      email: "test@example.com",
      password: "securepassword",
    });

    expect(redis.expire).toHaveBeenCalled();
  });
});

describe("POST /refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbSelectResult = [{ id: "user-1", email: "test@example.com" }];
    mockVerifyRefreshToken.mockReturnValue({ sub: "user-1" });
    mockSignAccessToken.mockReturnValue("new-access-token");
    mockDb.select.mockReturnValue(createSelectBuilder());
  });

  it("should return 401 when refresh_token cookie is missing", async () => {
    const app = makeApp();
    const res = await app.request("/refresh", { method: "POST" });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Refresh token required");
  });

  it("should return 401 when refresh token verification fails", async () => {
    mockVerifyRefreshToken.mockImplementation(() => {
      throw new Error("expired");
    });

    const app = makeApp();
    const res = await app.request("/refresh", {
      method: "POST",
      headers: { Cookie: "refresh_token=bad-token" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid or expired refresh token");
  });

  it("should return 401 when refresh token is revoked in Redis", async () => {
    const redis = createMockRedis();
    redis.get.mockResolvedValue(null);
    const app = makeApp(redis);

    const res = await app.request("/refresh", {
      method: "POST",
      headers: { Cookie: "refresh_token=revoked-token" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Refresh token revoked");
  });

  it("should return new access token for valid refresh", async () => {
    const redis = createMockRedis();
    redis.get.mockResolvedValue("user-1");
    const app = makeApp(redis);

    const res = await app.request("/refresh", {
      method: "POST",
      headers: { Cookie: "refresh_token=valid-token" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ accessToken: "new-access-token" });
  });

  it("should return 401 when user not found", async () => {
    mockDbSelectResult = [];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await app.request("/refresh", {
      method: "POST",
      headers: { Cookie: "refresh_token=valid-token" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("User not found");
  });

  it("should succeed without Redis (no revocation check)", async () => {
    const app = makeApp(null);

    const res = await app.request("/refresh", {
      method: "POST",
      headers: { Cookie: "refresh_token=valid-token" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ accessToken: "new-access-token" });
  });
});

describe("POST /logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and delete refresh cookie", async () => {
    const app = makeApp();
    const res = await app.request("/logout", {
      method: "POST",
      headers: { Cookie: "refresh_token=some-token" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ message: "Logged out" });
  });

  it("should delete refresh token from Redis when available", async () => {
    const redis = createMockRedis();
    const app = makeApp(redis);

    await app.request("/logout", {
      method: "POST",
      headers: { Cookie: "refresh_token=some-token" },
    });

    expect(redis.del).toHaveBeenCalledWith("refresh:some-token");
  });

  it("should succeed even without refresh_token cookie", async () => {
    const app = makeApp();
    const res = await app.request("/logout", { method: "POST" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ message: "Logged out" });
  });
});

describe("POST /forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
    mockDb.select.mockReturnValue(createSelectBuilder());
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => Promise.resolve(mockDbUpdateResult)),
      }),
    });
  });

  it("should return 400 for invalid input", async () => {
    const app = makeApp();
    const res = await jsonRequest(app, "/forgot-password", { email: "bad" });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
  });

  it("should return 200 even when user does not exist (prevent enumeration)", async () => {
    mockDbSelectResult = [];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await jsonRequest(app, "/forgot-password", {
      email: "nouser@example.com",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("If the email exists, a reset link has been sent");
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should send password reset email when user exists", async () => {
    mockDbSelectResult = [{ id: "user-1" }];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await jsonRequest(app, "/forgot-password", {
      email: "test@example.com",
    });

    expect(res.status).toBe(200);
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      "test@example.com",
      expect.any(String),
    );
  });
});

describe("POST /reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHashPassword.mockResolvedValue("new-hash");
    mockDb.select.mockReturnValue(createSelectBuilder());
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => Promise.resolve(mockDbUpdateResult)),
      }),
    });
  });

  it("should return 400 for invalid input", async () => {
    const app = makeApp();
    const res = await jsonRequest(app, "/reset-password", { token: "" });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
  });

  it("should return 400 when token not found", async () => {
    mockDbSelectResult = [];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await jsonRequest(app, "/reset-password", {
      token: "bad-token",
      password: "newpassword",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid or expired reset token");
  });

  it("should return 400 when token is expired", async () => {
    mockDbSelectResult = [
      {
        id: "user-1",
        passwordResetToken: "valid-token",
        passwordResetExpires: new Date(Date.now() - 1000),
      },
    ];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await jsonRequest(app, "/reset-password", {
      token: "valid-token",
      password: "newpassword",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid or expired reset token");
  });

  it("should return 400 when passwordResetExpires is null", async () => {
    mockDbSelectResult = [
      {
        id: "user-1",
        passwordResetToken: "valid-token",
        passwordResetExpires: null,
      },
    ];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await jsonRequest(app, "/reset-password", {
      token: "valid-token",
      password: "newpassword",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid or expired reset token");
  });

  it("should reset password successfully", async () => {
    mockDbSelectResult = [
      {
        id: "user-1",
        passwordResetToken: "valid-token",
        passwordResetExpires: new Date(Date.now() + 60000),
      },
    ];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await jsonRequest(app, "/reset-password", {
      token: "valid-token",
      password: "newpassword",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Password reset successfully");
    expect(mockHashPassword).toHaveBeenCalledWith("newpassword");
  });
});

describe("GET /verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(createSelectBuilder());
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => Promise.resolve(mockDbUpdateResult)),
      }),
    });
  });

  it("should return 400 when token query param is missing", async () => {
    const app = makeApp();
    const res = await app.request("/verify-email");

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Token is required");
  });

  it("should return 400 when verification token is invalid", async () => {
    mockDbSelectResult = [];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await app.request("/verify-email?token=bad-token");

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid verification token");
  });

  it("should verify email successfully", async () => {
    mockDbSelectResult = [{ id: "user-1" }];
    mockDb.select.mockReturnValue(createSelectBuilder());

    const app = makeApp();
    const res = await app.request("/verify-email?token=valid-token");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Email verified successfully");
  });
});
