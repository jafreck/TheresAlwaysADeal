import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

const mockIncr = vi.fn();
const mockExpire = vi.fn();

vi.mock("ioredis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    incr: mockIncr,
    expire: mockExpire,
  })),
}));

// ─── Module under test ───────────────────────────────────────────────────────

// We need to reset the module-level _redis singleton between describe blocks.
// Setting REDIS_URL before import so the lazy getter creates a client.

describe("rateLimit middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIncr.mockReset();
    mockExpire.mockReset();
  });

  // Helper to create a minimal Hono-like context
  function createContext(overrides: { ip?: string; path?: string } = {}) {
    const { ip = "127.0.0.1", path = "/login" } = overrides;
    const headers: Record<string, string> = {};
    if (ip) headers["x-forwarded-for"] = ip;

    return {
      req: {
        header: (name: string) => headers[name.toLowerCase()] ?? undefined,
        path,
      },
      json: vi.fn((body: any, status: number) => ({ body, status })),
    } as any;
  }

  describe("when Redis is available", () => {
    beforeEach(() => {
      process.env.REDIS_URL = "redis://localhost:6379";
    });

    it("should call next() when under the limit", async () => {
      // Need to re-import to pick up REDIS_URL and create redis client
      vi.resetModules();
      const { rateLimit } = await import("../../src/middleware/rate-limit.js");

      mockIncr.mockResolvedValue(1);
      mockExpire.mockResolvedValue(1);

      const middleware = rateLimit({ maxAttempts: 5, windowSeconds: 60 });
      const ctx = createContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(next).toHaveBeenCalled();
      expect(ctx.json).not.toHaveBeenCalled();
    });

    it("should set expire on first request (incr returns 1)", async () => {
      vi.resetModules();
      const { rateLimit } = await import("../../src/middleware/rate-limit.js");

      mockIncr.mockResolvedValue(1);
      mockExpire.mockResolvedValue(1);

      const middleware = rateLimit({ maxAttempts: 5, windowSeconds: 60 });
      const ctx = createContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(mockExpire).toHaveBeenCalledWith(
        expect.stringContaining("rate_limit:"),
        60,
      );
    });

    it("should not set expire on subsequent requests", async () => {
      vi.resetModules();
      const { rateLimit } = await import("../../src/middleware/rate-limit.js");

      mockIncr.mockResolvedValue(3);

      const middleware = rateLimit({ maxAttempts: 5, windowSeconds: 60 });
      const ctx = createContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(mockExpire).not.toHaveBeenCalled();
    });

    it("should return 429 when limit is exceeded", async () => {
      vi.resetModules();
      const { rateLimit } = await import("../../src/middleware/rate-limit.js");

      mockIncr.mockResolvedValue(6);

      const middleware = rateLimit({ maxAttempts: 5, windowSeconds: 60 });
      const ctx = createContext();
      const next = vi.fn();

      const result = await middleware(ctx, next);

      expect(ctx.json).toHaveBeenCalledWith({ error: "Too many requests" }, 429);
      expect(next).not.toHaveBeenCalled();
    });

    it("should derive rate limit key from IP and path", async () => {
      vi.resetModules();
      const { rateLimit } = await import("../../src/middleware/rate-limit.js");

      mockIncr.mockResolvedValue(1);
      mockExpire.mockResolvedValue(1);

      const middleware = rateLimit({ maxAttempts: 10, windowSeconds: 120 });
      const ctx = createContext({ ip: "10.0.0.1", path: "/auth/login" });
      const next = vi.fn();

      await middleware(ctx, next);

      expect(mockIncr).toHaveBeenCalledWith("rate_limit:/auth/login:10.0.0.1");
    });

    it("should fail open when Redis throws an error", async () => {
      vi.resetModules();
      const { rateLimit } = await import("../../src/middleware/rate-limit.js");

      mockIncr.mockRejectedValue(new Error("Redis connection lost"));

      const middleware = rateLimit({ maxAttempts: 5, windowSeconds: 60 });
      const ctx = createContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("when Redis is unavailable", () => {
    it("should fail open and call next()", async () => {
      delete process.env.REDIS_URL;
      vi.resetModules();
      const { rateLimit } = await import("../../src/middleware/rate-limit.js");

      const middleware = rateLimit({ maxAttempts: 5, windowSeconds: 60 });
      const ctx = createContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(next).toHaveBeenCalled();
      expect(mockIncr).not.toHaveBeenCalled();
    });
  });
});
