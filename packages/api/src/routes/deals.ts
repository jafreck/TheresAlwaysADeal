import { Hono } from "hono";
import { eq, sql, desc, and, count } from "drizzle-orm";
import type { Redis as RedisClient } from "ioredis";
import {
  db,
  games,
  storeListings,
  stores,
  priceHistory,
  storeListingStats,
  gameGenres,
  genres,
  gamePlatforms,
  platforms,
} from "@taad/db";
import { dealsQuerySchema, commonQuerySchema } from "../lib/validation.js";
import { buildEnvelopeResponse } from "../lib/response.js";

export function createDealsApp(getRedis: () => RedisClient | null) {
  const app = new Hono();

  // GET / — paginated deals sorted by deal score with filtering
  app.get("/", async (c) => {
    const parsed = dealsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
    }
    const { page, limit, store, genre, platform, min_discount, max_price } = parsed.data;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (store) {
      conditions.push(eq(stores.slug, store));
    }
    if (genre) {
      conditions.push(
        sql`${games.id} IN (
          SELECT ${gameGenres.gameId} FROM ${gameGenres}
          JOIN ${genres} ON ${genres.id} = ${gameGenres.genreId}
          WHERE ${genres.slug} = ${genre}
        )`,
      );
    }
    if (platform) {
      conditions.push(
        sql`${games.id} IN (
          SELECT ${gamePlatforms.gameId} FROM ${gamePlatforms}
          JOIN ${platforms} ON ${platforms.id} = ${gamePlatforms.platformId}
          WHERE ${platforms.slug} = ${platform}
        )`,
      );
    }
    if (min_discount !== undefined) {
      conditions.push(sql`${priceHistory.discount} >= ${min_discount}`);
    }
    if (max_price !== undefined) {
      conditions.push(sql`${priceHistory.price} <= ${max_price}`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Join games → storeListings → stores → latest priceHistory → storeListingStats
    const baseQuery = db
      .select({
        gameId: games.id,
        gameTitle: games.title,
        gameSlug: games.slug,
        headerImageUrl: games.headerImageUrl,
        storeListingId: storeListings.id,
        storeName: stores.name,
        storeSlug: stores.slug,
        storeUrl: storeListings.storeUrl,
        price: priceHistory.price,
        originalPrice: priceHistory.originalPrice,
        discount: priceHistory.discount,
        dealScore: storeListingStats.dealScore,
        isAllTimeLow: storeListingStats.isAllTimeLow,
      })
      .from(storeListings)
      .innerJoin(games, eq(games.id, storeListings.gameId))
      .innerJoin(stores, eq(stores.id, storeListings.storeId))
      .innerJoin(storeListingStats, eq(storeListingStats.storeListingId, storeListings.id))
      .innerJoin(
        priceHistory,
        sql`${priceHistory.storeListingId} = ${storeListings.id}
            AND ${priceHistory.recordedAt} = (
              SELECT MAX(ph2.recorded_at) FROM price_history ph2
              WHERE ph2.store_listing_id = ${storeListings.id}
            )`,
      )
      .where(where);

    // Count query
    const countQuery = db
      .select({ total: count() })
      .from(storeListings)
      .innerJoin(games, eq(games.id, storeListings.gameId))
      .innerJoin(stores, eq(stores.id, storeListings.storeId))
      .innerJoin(storeListingStats, eq(storeListingStats.storeListingId, storeListings.id))
      .innerJoin(
        priceHistory,
        sql`${priceHistory.storeListingId} = ${storeListings.id}
            AND ${priceHistory.recordedAt} = (
              SELECT MAX(ph2.recorded_at) FROM price_history ph2
              WHERE ph2.store_listing_id = ${storeListings.id}
            )`,
      )
      .where(where);

    const [totalResult] = await countQuery;
    const total = totalResult?.total ?? 0;

    const rows = await baseQuery
      .orderBy(desc(storeListingStats.dealScore))
      .limit(limit)
      .offset(offset);

    return c.json(buildEnvelopeResponse(rows, total, page, limit));
  });

  // GET /free — currently free games (price = 0)
  app.get("/free", async (c) => {
    const parsed = commonQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
    }
    const { page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const freeCondition = sql`${priceHistory.price} = 0`;

    const [totalResult] = await db
      .select({ total: count() })
      .from(storeListings)
      .innerJoin(games, eq(games.id, storeListings.gameId))
      .innerJoin(stores, eq(stores.id, storeListings.storeId))
      .innerJoin(
        priceHistory,
        sql`${priceHistory.storeListingId} = ${storeListings.id}
            AND ${priceHistory.recordedAt} = (
              SELECT MAX(ph2.recorded_at) FROM price_history ph2
              WHERE ph2.store_listing_id = ${storeListings.id}
            )`,
      )
      .where(freeCondition);
    const total = totalResult?.total ?? 0;

    const rows = await db
      .select({
        gameId: games.id,
        gameTitle: games.title,
        gameSlug: games.slug,
        headerImageUrl: games.headerImageUrl,
        storeListingId: storeListings.id,
        storeName: stores.name,
        storeSlug: stores.slug,
        storeUrl: storeListings.storeUrl,
        price: priceHistory.price,
        originalPrice: priceHistory.originalPrice,
        discount: priceHistory.discount,
      })
      .from(storeListings)
      .innerJoin(games, eq(games.id, storeListings.gameId))
      .innerJoin(stores, eq(stores.id, storeListings.storeId))
      .innerJoin(
        priceHistory,
        sql`${priceHistory.storeListingId} = ${storeListings.id}
            AND ${priceHistory.recordedAt} = (
              SELECT MAX(ph2.recorded_at) FROM price_history ph2
              WHERE ph2.store_listing_id = ${storeListings.id}
            )`,
      )
      .where(freeCondition)
      .orderBy(desc(games.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json(buildEnvelopeResponse(rows, total, page, limit));
  });

  // GET /all-time-lows — games currently at their all-time lowest price
  app.get("/all-time-lows", async (c) => {
    const parsed = commonQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
    }
    const { page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const atlCondition = eq(storeListingStats.isAllTimeLow, true);

    const [totalResult] = await db
      .select({ total: count() })
      .from(storeListings)
      .innerJoin(games, eq(games.id, storeListings.gameId))
      .innerJoin(stores, eq(stores.id, storeListings.storeId))
      .innerJoin(storeListingStats, eq(storeListingStats.storeListingId, storeListings.id))
      .where(atlCondition);
    const total = totalResult?.total ?? 0;

    const rows = await db
      .select({
        gameId: games.id,
        gameTitle: games.title,
        gameSlug: games.slug,
        headerImageUrl: games.headerImageUrl,
        storeListingId: storeListings.id,
        storeName: stores.name,
        storeSlug: stores.slug,
        storeUrl: storeListings.storeUrl,
        allTimeLowPrice: storeListingStats.allTimeLowPrice,
        dealScore: storeListingStats.dealScore,
      })
      .from(storeListings)
      .innerJoin(games, eq(games.id, storeListings.gameId))
      .innerJoin(stores, eq(stores.id, storeListings.storeId))
      .innerJoin(storeListingStats, eq(storeListingStats.storeListingId, storeListings.id))
      .where(atlCondition)
      .orderBy(desc(storeListingStats.dealScore))
      .limit(limit)
      .offset(offset);

    return c.json(buildEnvelopeResponse(rows, total, page, limit));
  });

  // GET /rankings — deal score rankings (Redis → DB fallback)
  app.get("/rankings", async (c) => {
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
      .select({
        storeListingId: storeListingStats.storeListingId,
        dealScore: storeListingStats.dealScore,
      })
      .from(storeListingStats)
      .orderBy(desc(storeListingStats.dealScore))
      .limit(limit)
      .offset(offset);

    return c.json(
      rows.map((r) => ({ storeListingId: r.storeListingId, dealScore: Number(r.dealScore ?? 0) })),
    );
  });

  // GET /:storeListingId/stats — full storeListingStats row
  app.get("/:storeListingId/stats", async (c) => {
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

  return app;
}
