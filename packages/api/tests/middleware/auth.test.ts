import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

const mockVerifyAccessToken = vi.fn();

vi.mock("../../src/lib/jwt.js", () => ({
  verifyAccessToken: (...args: unknown[]) => mockVerifyAccessToken(...args),
}));

const { authMiddleware } = await import("../../src/middleware/auth.js");

describe("authMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.use("*", authMiddleware);
    app.get("/protected", (c) => c.json({ user: c.get("user") }));
  });

  it("should return 401 when Authorization header is missing", async () => {
    const res = await app.request("/protected");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Authorization header required" });
  });

  it("should return 401 for non-Bearer authorization", async () => {
    const res = await app.request("/protected", {
      headers: { Authorization: "Basic abc123" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Invalid authorization format" });
  });

  it("should return 401 when Bearer token has extra parts", async () => {
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer token extra" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Invalid authorization format" });
  });

  it("should return 401 when token verification fails", async () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer bad-token" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Invalid or expired token" });
  });

  it("should set user on context and call next for valid token", async () => {
    const payload = { sub: "user-1", email: "test@example.com" };
    mockVerifyAccessToken.mockReturnValue(payload);

    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual(payload);
    expect(mockVerifyAccessToken).toHaveBeenCalledWith("valid-token");
  });

  it("should return 401 for Authorization header with only 'Bearer'", async () => {
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Invalid authorization format" });
  });
});
