import { Hono } from "hono";
import { eq, ilike, sql, desc, asc, and, count } from "drizzle-orm";
import {
  db,
  games,
  storeListings,
  stores,
  priceHistory,
  storeListingStats,
  gameGenres,
  genres,
} from "@taad/db";
import {
  commonQuerySchema,
  searchQuerySchema,
  priceHistoryQuerySchema,
} from "../lib/validation.js";
import { buildEnvelopeResponse } from "../lib/response.js";

const app = new Hono();

// GET / — paginated games list with filtering, sorting, pagination
app.get("/", async (c) => {
  const parsed = commonQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }
  const { page, limit, store, genre, sort } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (store) {
    conditions.push(
      sql`${games.id} IN (
        SELECT ${storeListings.gameId} FROM ${storeListings}
        JOIN ${stores} ON ${stores.id} = ${storeListings.storeId}
        WHERE ${stores.slug} = ${store}
      )`,
    );
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

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let orderBy;
  switch (sort) {
    case "release_date":
      orderBy = desc(games.createdAt);
      break;
    case "price":
      orderBy = asc(games.title);
      break;
    case "discount":
    case "deal_score":
      orderBy = desc(games.updatedAt);
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

// GET /search — case-insensitive title search
app.get("/search", async (c) => {
  const parsed = searchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }
  const { q, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const where = ilike(games.title, `%${q}%`);

  const [totalResult] = await db
    .select({ total: count() })
    .from(games)
    .where(where);
  const total = totalResult?.total ?? 0;

  const rows = await db
    .select()
    .from(games)
    .where(where)
    .orderBy(desc(games.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json(buildEnvelopeResponse(rows, total, page, limit));
});

// GET /:slug — game detail with store listings and price stats
app.get("/:slug", async (c) => {
  const { slug } = c.req.param();

  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.slug, slug))
    .limit(1);

  if (!game) {
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

// GET /:slug/price-history — price history for a game
app.get("/:slug/price-history", async (c) => {
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

export { app as gamesApp };
