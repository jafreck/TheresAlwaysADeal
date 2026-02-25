import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { desc, eq } from "drizzle-orm";
import { Redis, type Redis as RedisClient } from "ioredis";
import { db, storeListingStats } from "@taad/db";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

// Lazy Redis client — only created when REDIS_URL is present
let _redis: RedisClient | null = null;
function getRedis(): RedisClient | null {
  if (!process.env.REDIS_URL) return null;
  if (!_redis) _redis = new Redis(process.env.REDIS_URL);
  return _redis;
}

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// GET /deals/rankings — returns deal score rankings (Redis → DB fallback)
app.get("/deals/rankings", async (c) => {
  const limit = Number(c.req.query("limit") ?? 20);
  const offset = Number(c.req.query("offset") ?? 0);

  const redis = getRedis();
  if (redis) {
    const results = await redis.zrevrangebyscore(
      "deal_scores",
      "+inf",
      "-inf",
      "WITHSCORES",
      "LIMIT",
      offset,
      limit,
    );
    if (results.length > 0) {
      const rankings: { storeListingId: string; dealScore: number }[] = [];
      for (let i = 0; i < results.length; i += 2) {
        rankings.push({ storeListingId: results[i]!, dealScore: Number(results[i + 1]) });
      }
      return c.json(rankings);
    }
  }

  // Cache miss — fall back to DB
  const rows = await db
    .select({ storeListingId: storeListingStats.storeListingId, dealScore: storeListingStats.dealScore })
    .from(storeListingStats)
    .orderBy(desc(storeListingStats.dealScore))
    .limit(limit)
    .offset(offset);

  return c.json(rows.map((r) => ({ storeListingId: r.storeListingId, dealScore: Number(r.dealScore ?? 0) })));
});

// GET /deals/:storeListingId/stats — returns full storeListingStats row
app.get("/deals/:storeListingId/stats", async (c) => {
  const { storeListingId } = c.req.param();

  const [stats] = await db
    .select()
    .from(storeListingStats)
    .where(eq(storeListingStats.storeListingId, storeListingId))
    .limit(1);

  if (!stats) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(stats);
});

export { app };

const port = Number(process.env.API_PORT ?? 3001);

console.log(`API server starting on port ${port}`);

serve({ fetch: app.fetch, port });
