import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

const mockVerifyAccessToken = vi.fn();

vi.mock("../../src/lib/jwt.js", () => ({
  verifyAccessToken: (...args: any[]) => mockVerifyAccessToken(...args),
}));

// ─── Module under test ───────────────────────────────────────────────────────

const { authMiddleware } = await import("../../src/middleware/auth.js");

// ─── Test app ────────────────────────────────────────────────────────────────

function createApp() {
  const app = new Hono();
  app.use("/protected/*", authMiddleware);
  app.get("/protected/resource", (c) => {
    const userId = c.get("userId");
    return c.json({ userId });
  });
  return app;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("authMiddleware", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  it("should return 401 when Authorization header is missing", async () => {
    const res = await app.request("/protected/resource");
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: "Authorization header is required" });
  });

  it("should return 401 when Authorization header has no Bearer prefix", async () => {
    const res = await app.request("/protected/resource", {
      headers: { Authorization: "Basic abc123" },
    });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: "Malformed Authorization header" });
  });

  it("should return 401 when Authorization header has only Bearer with no token", async () => {
    const res = await app.request("/protected/resource", {
      headers: { Authorization: "Bearer" },
    });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: "Malformed Authorization header" });
  });

  it("should return 401 when Authorization header has too many parts", async () => {
    const res = await app.request("/protected/resource", {
      headers: { Authorization: "Bearer token extra" },
    });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: "Malformed Authorization header" });
  });

  it("should return 401 when token verification fails", async () => {
    mockVerifyAccessToken.mockRejectedValue(new Error("Token expired"));

    const res = await app.request("/protected/resource", {
      headers: { Authorization: "Bearer invalid-token" },
    });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: "Invalid or expired token" });
  });

  it("should set userId on context and call next when token is valid", async () => {
    mockVerifyAccessToken.mockResolvedValue({ sub: "user-123", type: "access" });

    const res = await app.request("/protected/resource", {
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ userId: "user-123" });
  });

  it("should pass the token string to verifyAccessToken", async () => {
    mockVerifyAccessToken.mockResolvedValue({ sub: "user-456", type: "access" });

    await app.request("/protected/resource", {
      headers: { Authorization: "Bearer my-jwt-token" },
    });

    expect(mockVerifyAccessToken).toHaveBeenCalledWith("my-jwt-token");
  });

  it("should return 401 when Authorization value is an empty string", async () => {
    const res = await app.request("/protected/resource", {
      headers: { Authorization: "" },
    });
    // Empty string header may be treated as missing or malformed depending on framework
    // Hono may not send empty headers, but if it does, the middleware should reject it
    expect(res.status).toBe(401);
  });
});
