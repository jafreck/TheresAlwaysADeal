import type { MiddlewareHandler } from "hono";
import type { Redis as RedisClient } from "ioredis";

export function cacheMiddleware(
  ttlSeconds: number,
  getRedis: () => RedisClient | null,
): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method !== "GET") {
      await next();
      return;
    }

    const redis = getRedis();
    if (!redis) {
      await next();
      return;
    }

    const url = new URL(c.req.url);
    const sortedParams = new URLSearchParams([...url.searchParams.entries()].sort());
    const cacheKey = `cache:${url.pathname}?${sortedParams.toString()}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return c.json(parsed);
      }
    } catch {
      // Redis read error — skip cache
      await next();
      return;
    }

    await next();

    // Store response in cache after handler
    if (c.res.status === 200) {
      try {
        const body = await c.res.clone().json();
        await redis.set(cacheKey, JSON.stringify(body), "EX", ttlSeconds);
      } catch {
        // Ignore cache write errors
      }
    }
  };
}
