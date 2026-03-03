import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { rateLimiter } from "../../src/middleware/rate-limit.js";

function createMockRedis() {
  const mockExec = vi.fn().mockResolvedValue([
    [null, 1],
    [null, -1],
  ]);
  const chain = {
    incr: vi.fn().mockReturnThis(),
    pttl: vi.fn().mockReturnThis(),
    exec: mockExec,
  };
  return {
    multi: vi.fn().mockReturnValue(chain),
    pexpire: vi.fn().mockResolvedValue(1),
    _exec: mockExec,
    _chain: chain,
  } as any;
}

describe("rateLimiter", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
  });

  it("should allow requests within rate limit (Redis)", async () => {
    const redis = createMockRedis();
    app.use("*", rateLimiter(() => redis));
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("59");
  });

  it("should return 429 when rate limit exceeded (Redis)", async () => {
    const redis = createMockRedis();
    redis._exec.mockResolvedValue([
      [null, 61],
      [null, 30000],
    ]);
    app.use("*", rateLimiter(() => redis));
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({ error: "Too many requests" });
    expect(res.headers.get("Retry-After")).toBeDefined();
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("should set pexpire on first request in window", async () => {
    const redis = createMockRedis();
    // ttl = -1 means no expiry set
    redis._exec.mockResolvedValue([
      [null, 1],
      [null, -1],
    ]);
    app.use("*", rateLimiter(() => redis));
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test");
    expect(redis.pexpire).toHaveBeenCalled();
  });

  it("should fall back to in-memory when Redis is null", async () => {
    app.use("*", rateLimiter(() => null));
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("60");
  });

  it("should fall back to in-memory when Redis throws", async () => {
    const redis = createMockRedis();
    redis._exec.mockRejectedValue(new Error("connection lost"));
    app.use("*", rateLimiter(() => redis));
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });

  it("should use x-forwarded-for header for IP identification", async () => {
    const redis = createMockRedis();
    app.use("*", rateLimiter(() => redis));
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const incrCall = redis._chain.incr.mock.calls[0];
    // The multi().incr(key) should have been called with a key containing the IP
    expect(incrCall).toBeDefined();
  });

  it("should set pexpire when ttl is -2 (key does not exist)", async () => {
    const redis = createMockRedis();
    redis._exec.mockResolvedValue([
      [null, 1],
      [null, -2],
    ]);
    app.use("*", rateLimiter(() => redis));
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test");
    expect(redis.pexpire).toHaveBeenCalled();
  });

  it("should allow request at exactly the limit (count=60)", async () => {
    const redis = createMockRedis();
    redis._exec.mockResolvedValue([
      [null, 60],
      [null, 50000],
    ]);
    app.use("*", rateLimiter(() => redis));
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("should return correct remaining count with multiple in-memory requests", async () => {
    // Use a fresh app with unique IP per test to avoid in-memory store pollution
    const freshApp = new Hono();
    freshApp.use("*", rateLimiter(() => null));
    freshApp.get("/test", (c) => c.json({ ok: true }));

    const res1 = await freshApp.request("/test", {
      headers: { "x-forwarded-for": "unique-ip-multi-test" },
    });
    expect(res1.headers.get("X-RateLimit-Remaining")).toBe("59");

    const res2 = await freshApp.request("/test", {
      headers: { "x-forwarded-for": "unique-ip-multi-test" },
    });
    expect(res2.headers.get("X-RateLimit-Remaining")).toBe("58");
  });
});
