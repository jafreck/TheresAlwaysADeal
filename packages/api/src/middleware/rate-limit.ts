import type { Context, Next } from "hono";
import { Redis, type Redis as RedisClient } from "ioredis";

let _redis: RedisClient | null = null;

function getRedis(): RedisClient | null {
  if (!process.env.REDIS_URL) return null;
  if (!_redis) _redis = new Redis(process.env.REDIS_URL);
  return _redis;
}

interface RateLimitOptions {
  maxAttempts: number;
  windowSeconds: number;
}

export function rateLimit({ maxAttempts, windowSeconds }: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    const redis = getRedis();
    if (!redis) {
      // Fail open when Redis is unavailable
      await next();
      return;
    }

    const ip = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown";
    const key = `rate_limit:${c.req.path}:${ip}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > maxAttempts) {
        return c.json({ error: "Too many requests" }, 429);
      }
    } catch {
      // Fail open on Redis errors
    }

    await next();
  };
}
