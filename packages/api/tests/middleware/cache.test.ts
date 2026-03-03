import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { cacheMiddleware } from "../../src/middleware/cache.js";

function createMockRedis(overrides: Record<string, any> = {}) {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    ...overrides,
  } as any;
}

describe("cacheMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
  });

  it("should call next without caching when Redis is null", async () => {
    const handler = vi.fn((c) => c.json({ ok: true }));
    app.use("*", cacheMiddleware(300, () => null));
    app.get("/test", handler);

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it("should skip caching for non-GET requests", async () => {
    const redis = createMockRedis();
    const handler = vi.fn((c) => c.json({ ok: true }));
    app.use("*", cacheMiddleware(300, () => redis));
    app.post("/test", handler);

    const res = await app.request("/test", { method: "POST" });
    expect(res.status).toBe(200);
    expect(redis.get).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
  });

  it("should return cached response on cache hit", async () => {
    const cached = JSON.stringify({ cached: true });
    const redis = createMockRedis({ get: vi.fn().mockResolvedValue(cached) });
    const handler = vi.fn((c) => c.json({ fresh: true }));
    app.use("*", cacheMiddleware(300, () => redis));
    app.get("/test", handler);

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ cached: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("should store response in cache on cache miss", async () => {
    const redis = createMockRedis();
    app.use("*", cacheMiddleware(60, () => redis));
    app.get("/test", (c) => c.json({ fresh: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining("cache:"),
      JSON.stringify({ fresh: true }),
      "EX",
      60,
    );
  });

  it("should sort query parameters for consistent cache keys", async () => {
    const redis = createMockRedis();
    app.use("*", cacheMiddleware(60, () => redis));
    app.get("/test", (c) => c.json({ ok: true }));

    await app.request("/test?b=2&a=1");
    const cacheKey = redis.set.mock.calls[0]?.[0];
    expect(cacheKey).toContain("a=1&b=2");
  });

  it("should not cache non-200 responses", async () => {
    const redis = createMockRedis();
    app.use("*", cacheMiddleware(60, () => redis));
    app.get("/test", (c) => c.json({ error: "bad" }, 400));

    const res = await app.request("/test");
    expect(res.status).toBe(400);
    expect(redis.set).not.toHaveBeenCalled();
  });

  it("should gracefully handle Redis get errors", async () => {
    const redis = createMockRedis({
      get: vi.fn().mockRejectedValue(new Error("connection lost")),
    });
    const handler = vi.fn((c) => c.json({ fallback: true }));
    app.use("*", cacheMiddleware(60, () => redis));
    app.get("/test", handler);

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it("should gracefully handle Redis set errors", async () => {
    const redis = createMockRedis({
      set: vi.fn().mockRejectedValue(new Error("connection lost")),
    });
    app.use("*", cacheMiddleware(60, () => redis));
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
