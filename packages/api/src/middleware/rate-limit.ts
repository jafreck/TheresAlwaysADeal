import type { MiddlewareHandler } from "hono";
import type { Redis as RedisClient } from "ioredis";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

// In-memory fallback store
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(getRedis: () => RedisClient | null): MiddlewareHandler {
  return async (c, next) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? c.req.header("x-real-ip") ?? "unknown";
    const now = Date.now();
    const windowKey = `ratelimit:${ip}`;

    let remaining: number;
    let retryAfter: number;

    const redis = getRedis();
    if (redis) {
      try {
        const multi = redis.multi();
        multi.incr(windowKey);
        multi.pttl(windowKey);
        const results = await multi.exec();

        const count = (results?.[0]?.[1] as number) ?? 1;
        const ttl = (results?.[1]?.[1] as number) ?? -1;

        // Set expiry on first request in window
        if (ttl === -1 || ttl === -2) {
          await redis.pexpire(windowKey, WINDOW_MS);
        }

        remaining = Math.max(0, MAX_REQUESTS - count);
        retryAfter = Math.ceil((ttl > 0 ? ttl : WINDOW_MS) / 1000);

        if (count > MAX_REQUESTS) {
          c.header("X-RateLimit-Limit", String(MAX_REQUESTS));
          c.header("X-RateLimit-Remaining", "0");
          c.header("Retry-After", String(retryAfter));
          return c.json({ error: "Too many requests" }, 429);
        }
      } catch {
        // Redis error — fall through to in-memory
        const entry = memoryStore.get(ip);
        if (entry && now < entry.resetAt) {
          entry.count++;
          if (entry.count > MAX_REQUESTS) {
            remaining = 0;
            retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            c.header("X-RateLimit-Limit", String(MAX_REQUESTS));
            c.header("X-RateLimit-Remaining", "0");
            c.header("Retry-After", String(retryAfter));
            return c.json({ error: "Too many requests" }, 429);
          }
          remaining = MAX_REQUESTS - entry.count;
        } else {
          memoryStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
          remaining = MAX_REQUESTS - 1;
        }
        retryAfter = Math.ceil(WINDOW_MS / 1000);
      }
    } else {
      // In-memory fallback
      const entry = memoryStore.get(ip);
      if (entry && now < entry.resetAt) {
        entry.count++;
        if (entry.count > MAX_REQUESTS) {
          remaining = 0;
          retryAfter = Math.ceil((entry.resetAt - now) / 1000);
          c.header("X-RateLimit-Limit", String(MAX_REQUESTS));
          c.header("X-RateLimit-Remaining", "0");
          c.header("Retry-After", String(retryAfter));
          return c.json({ error: "Too many requests" }, 429);
        }
        remaining = MAX_REQUESTS - entry.count;
      } else {
        memoryStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        remaining = MAX_REQUESTS - 1;
      }
      retryAfter = Math.ceil(WINDOW_MS / 1000);
    }

    c.header("X-RateLimit-Limit", String(MAX_REQUESTS));
    c.header("X-RateLimit-Remaining", String(remaining));

    await next();
  };
}
