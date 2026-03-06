import { Hono } from "hono";
import { eq, sql, desc, and, count, inArray } from "drizzle-orm";
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
  searchAnalytics,
  slugRedirects,
} from "@taad/db";
import {
  commonQuerySchema,
  searchQuerySchema,
  autocompleteQuerySchema,
  priceHistoryQuerySchema,
} from "../lib/validation.js";
import { buildEnvelopeResponse } from "../lib/response.js";
import { cacheMiddleware } from "../middleware/cache.js";

export function createGamesApp(getRedis: () => RedisClient | null) {
const app = new Hono();

// GET / — paginated games list with filtering, sorting, pagination (5-min cache)
app.get("/", cacheMiddleware(300, getRedis), async (c) => {
  const parsed = commonQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }
  const { page, limit, store, genre, sort } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (store) {
    const storeSlugs = store.split(",").map((s) => s.trim()).filter(Boolean);
    if (storeSlugs.length === 1) {
      conditions.push(
        sql`${games.id} IN (
          SELECT ${storeListings.gameId} FROM ${storeListings}
          JOIN ${stores} ON ${stores.id} = ${storeListings.storeId}
          WHERE ${stores.slug} = ${storeSlugs[0]}
        )`,
      );
    } else if (storeSlugs.length > 1) {
      conditions.push(
        sql`${games.id} IN (
          SELECT ${storeListings.gameId} FROM ${storeListings}
          JOIN ${stores} ON ${stores.id} = ${storeListings.storeId}
          WHERE ${inArray(stores.slug, storeSlugs)}
        )`,
      );
    }
  }
  if (genre) {
    const genreSlugs = genre.split(",").map((s) => s.trim()).filter(Boolean);
    if (genreSlugs.length > 0) {
      conditions.push(
        sql`${games.id} IN (
          SELECT ${gameGenres.gameId} FROM ${gameGenres}
          JOIN ${genres} ON ${genres.id} = ${gameGenres.genreId}
          WHERE ${inArray(genres.slug, genreSlugs)}
        )`,
      );
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let orderBy;
  switch (sort) {
    case "a_z":
      orderBy = sql`${games.title} ASC`;
      break;
    case "release_date":
      orderBy = desc(games.createdAt);
      break;
    default:
      orderBy = desc(games.createdAt);
  }

  const [totalResult] = await db
    .select({ total: count() })
    .from(games)
    .where(where);
  const total = totalResult?.total ?? 0;

  const rows = await db
    .select()
    .from(games)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return c.json(buildEnvelopeResponse(rows, total, page, limit));
});

// GET /search — full-text search with trigram fuzzy matching (5-min cache)
app.get("/search", cacheMiddleware(300, getRedis), async (c) => {
  try {
  const parsed = searchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }
  const { q, page, limit, store, genre, min_discount, max_price, sort } = parsed.data;
  const offset = (page - 1) * limit;

  // FTS + trigram similarity for fuzzy matching
  const conditions = [
    sql`(
      to_tsvector('english', ${games.title}) @@ plainto_tsquery('english', ${q})
      OR similarity(${games.title}, ${q}) > 0.1
    )`,
  ];

  if (store) {
    const storeSlugs = store.split(",").map((s) => s.trim()).filter(Boolean);
    if (storeSlugs.length === 1) {
      conditions.push(
        sql`${games.id} IN (
          SELECT ${storeListings.gameId} FROM ${storeListings}
          JOIN ${stores} ON ${stores.id} = ${storeListings.storeId}
          WHERE ${stores.slug} = ${storeSlugs[0]}
        )`,
      );
    } else if (storeSlugs.length > 1) {
      conditions.push(
        sql`${games.id} IN (
          SELECT ${storeListings.gameId} FROM ${storeListings}
          JOIN ${stores} ON ${stores.id} = ${storeListings.storeId}
          WHERE ${inArray(stores.slug, storeSlugs)}
        )`,
      );
    }
  }
  if (genre) {
    const genreSlugs = genre.split(",").map((s) => s.trim()).filter(Boolean);
    if (genreSlugs.length > 0) {
      conditions.push(
        sql`${games.id} IN (
          SELECT ${gameGenres.gameId} FROM ${gameGenres}
          JOIN ${genres} ON ${genres.id} = ${gameGenres.genreId}
          WHERE ${inArray(genres.slug, genreSlugs)}
        )`,
      );
    }
  }
  if (min_discount !== undefined) {
    conditions.push(
      sql`${games.id} IN (
        SELECT ${storeListings.gameId} FROM ${storeListings}
        JOIN ${priceHistory} ON ${priceHistory.storeListingId} = ${storeListings.id}
          AND ${priceHistory.recordedAt} = (
            SELECT MAX(ph2.recorded_at) FROM price_history ph2
            WHERE ph2.store_listing_id = ${storeListings.id}
          )
        WHERE ${priceHistory.discount} >= ${min_discount}
      )`,
    );
  }
  if (max_price !== undefined) {
    conditions.push(
      sql`${games.id} IN (
        SELECT ${storeListings.gameId} FROM ${storeListings}
        JOIN ${priceHistory} ON ${priceHistory.storeListingId} = ${storeListings.id}
          AND ${priceHistory.recordedAt} = (
            SELECT MAX(ph2.recorded_at) FROM price_history ph2
            WHERE ph2.store_listing_id = ${storeListings.id}
          )
        WHERE ${priceHistory.price} <= ${max_price}
      )`,
    );
  }

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ total: count() })
    .from(games)
    .where(where);
  const total = totalResult?.total ?? 0;

  const rows = await db
    .select({
      id: games.id,
      title: games.title,
      slug: games.slug,
      description: games.description,
      headerImageUrl: games.headerImageUrl,
      createdAt: games.createdAt,
      updatedAt: games.updatedAt,
      bestPrice: sql<string>`(
        SELECT MIN(ph.price::numeric)
        FROM store_listings sl
        JOIN price_history ph ON ph.store_listing_id = sl.id
          AND ph.recorded_at = (
            SELECT MAX(ph2.recorded_at) FROM price_history ph2
            WHERE ph2.store_listing_id = sl.id
          )
        WHERE sl.game_id = games.id
      )`.as("best_price"),
    })
    .from(games)
    .where(where)
    .orderBy(
      sort === "lowest_price"
        ? sql`(${sql.raw("best_price")}) ASC NULLS LAST`
        : sort === "highest_discount"
          ? sql`(
              SELECT MAX(ph.discount::numeric)
              FROM store_listings sl
              JOIN price_history ph ON ph.store_listing_id = sl.id
                AND ph.recorded_at = (
                  SELECT MAX(ph2.recorded_at) FROM price_history ph2
                  WHERE ph2.store_listing_id = sl.id
                )
              WHERE sl.game_id = games.id
            ) DESC NULLS LAST`
          : sort === "a_z"
            ? sql`${games.title} ASC`
            : sort === "release_date"
              ? desc(games.createdAt)
              : desc(sql`ts_rank(to_tsvector('english', ${games.title}), plainto_tsquery('english', ${q})) + similarity(${games.title}, ${q})`),
    )
    .limit(limit)
    .offset(offset);

  // Track search analytics (fire-and-forget so analytics failures don't break search)
  db.insert(searchAnalytics).values({
    query: q,
    resultCount: total,
  }).catch(() => {});

  return c.json(buildEnvelopeResponse(rows, total, page, limit));
  } catch (err) {
    console.error("[search] Error:", err);
    return c.json({ error: "Search failed", message: String(err) }, 500);
  }
}); 

// GET /autocomplete — title suggestions via trigram similarity (5-min cache)
app.get("/autocomplete", cacheMiddleware(300, getRedis), async (c) => {
  const parsed = autocompleteQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }
  const { q, limit } = parsed.data;

  const rows = await db
    .select({
      title: games.title,
      slug: games.slug,
    })
    .from(games)
    .where(sql`similarity(${games.title}, ${q}) > 0.1`)
    .orderBy(sql`similarity(${games.title}, ${q}) DESC`)
    .limit(limit);

  return c.json({ data: rows });
});

// GET /:slug — game detail with store listings and price stats (1-min cache)
app.get("/:slug", cacheMiddleware(60, getRedis), async (c) => {
  const { slug } = c.req.param();

  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.slug, slug))
    .limit(1);

  if (!game) {
    // Check slug_redirects for an old slug that has been renamed
    const [redirectEntry] = await db
      .select({ newSlug: slugRedirects.newSlug })
      .from(slugRedirects)
      .where(eq(slugRedirects.oldSlug, slug))
      .limit(1);

    if (redirectEntry) {
      return c.json({ redirect: true, newSlug: redirectEntry.newSlug }, 301);
    }

    return c.json({ error: "Not found" }, 404);
  }

  const listings = await db
    .select({
      id: storeListings.id,
      storeId: storeListings.storeId,
      storeName: stores.name,
      storeSlug: stores.slug,
      storeUrl: storeListings.storeUrl,
      isActive: storeListings.isActive,
      isAllTimeLow: storeListings.isAllTimeLow,
    })
    .from(storeListings)
    .innerJoin(stores, eq(stores.id, storeListings.storeId))
    .where(eq(storeListings.gameId, game.id));

  const stats = await db
    .select()
    .from(storeListingStats)
    .where(
      sql`${storeListingStats.storeListingId} IN (
        SELECT ${storeListings.id} FROM ${storeListings}
        WHERE ${storeListings.gameId} = ${game.id}
      )`,
    );

  return c.json({ data: { ...game, storeListings: listings, priceStats: stats } });
});

// GET /:slug/price-history — price history for a game (1-min cache)
app.get("/:slug/price-history", cacheMiddleware(60, getRedis), async (c) => {
  const { slug } = c.req.param();

  const parsed = priceHistoryQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }
  const { store } = parsed.data;

  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.slug, slug))
    .limit(1);

  if (!game) {
    return c.json({ error: "Not found" }, 404);
  }

  const conditions = [eq(storeListings.gameId, game.id)];
  if (store) {
    conditions.push(
      sql`${storeListings.storeId} IN (
        SELECT ${stores.id} FROM ${stores} WHERE ${stores.slug} = ${store}
      )`,
    );
  }

  const rows = await db
    .select({
      id: priceHistory.id,
      storeListingId: priceHistory.storeListingId,
      price: priceHistory.price,
      originalPrice: priceHistory.originalPrice,
      currency: priceHistory.currency,
      discount: priceHistory.discount,
      saleEndsAt: priceHistory.saleEndsAt,
      recordedAt: priceHistory.recordedAt,
    })
    .from(priceHistory)
    .innerJoin(storeListings, eq(storeListings.id, priceHistory.storeListingId))
    .where(and(...conditions))
    .orderBy(desc(priceHistory.recordedAt));

  return c.json({ data: rows });
});

return app;
}
