import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, games, stores, storeListings, priceHistory } from "@taad/db";
import { gameSchema } from "./schemas.js";

export type ScrapedGame = z.infer<typeof gameSchema>;

export interface ScraperConfig {
  retailerDomain: string;
  headers?: Record<string, string>;
  rateLimitRps?: number;
  rateLimitRpm?: number;
  maxRetries?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Abstract base class for all retailer scrapers.
 * Subclasses implement fetchGames() and normalizeGame(raw).
 * Use Cheerio for static HTML pages; fall back to Playwright for JS-heavy pages.
 */
export abstract class BaseScraper {
  readonly retailerDomain: string;
  protected readonly headers: Record<string, string>;
  private readonly rateLimitRps: number | undefined;
  private readonly rateLimitRpm: number | undefined;
  private readonly maxRetries: number;

  private lastRequestTime = 0;
  private requestTimestamps: number[] = [];

  constructor(config: ScraperConfig) {
    this.retailerDomain = config.retailerDomain;
    this.headers = config.headers ?? {};
    this.rateLimitRps = config.rateLimitRps;
    this.rateLimitRpm = config.rateLimitRpm;
    this.maxRetries = config.maxRetries ?? 3;
  }

  abstract fetchGames(): Promise<unknown[]>;
  abstract normalizeGame(raw: unknown): ScrapedGame;

  /** Enforces RPS and RPM rate limits before each request. */
  protected async throttle(): Promise<void> {
    const now = Date.now();

    if (this.rateLimitRps !== undefined) {
      const minInterval = 1000 / this.rateLimitRps;
      const elapsed = now - this.lastRequestTime;
      if (elapsed < minInterval) {
        await sleep(minInterval - elapsed);
      }
    }

    if (this.rateLimitRpm !== undefined) {
      const windowStart = Date.now() - 60_000;
      this.requestTimestamps = this.requestTimestamps.filter((t) => t > windowStart);
      if (this.requestTimestamps.length >= this.rateLimitRpm) {
        const waitUntil = (this.requestTimestamps[0] ?? 0) + 60_000;
        const delay = waitUntil - Date.now();
        if (delay > 0) await sleep(delay);
        this.requestTimestamps = this.requestTimestamps.filter((t) => t > Date.now() - 60_000);
      }
    }

    this.lastRequestTime = Date.now();
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Wraps a fetch call with throttling and exponential-backoff retry on
   * 5xx HTTP status codes and network errors.
   */
  protected async fetchWithRetry(fn: () => Promise<Response>): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(Math.pow(2, attempt - 1) * 1000);
      }
      try {
        await this.throttle();
        const res = await fn();
        if (res.status >= 500) {
          lastError = new Error(`HTTP ${res.status}`);
          continue;
        }
        return res;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  }

  /** Writes scraped games to the database, upserting games/storeListings and recording price history. */
  async upsertGames(scrapedGames: ScrapedGame[]): Promise<void> {
    for (const game of scrapedGames) {
      // Upsert game by slug
      await db
        .insert(games)
        .values({ title: game.title, slug: game.slug })
        .onConflictDoUpdate({
          target: games.slug,
          set: { title: game.title, updatedAt: new Date() },
        });

      const [dbGame] = await db
        .select()
        .from(games)
        .where(eq(games.slug, game.slug))
        .limit(1);
      if (!dbGame) continue;

      // Resolve store by slug — store must already exist in the DB
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.slug, game.storeSlug))
        .limit(1);
      if (!store) continue;

      // Find or create store listing
      let [listing] = await db
        .select()
        .from(storeListings)
        .where(and(eq(storeListings.gameId, dbGame.id), eq(storeListings.storeId, store.id)))
        .limit(1);

      if (!listing) {
        [listing] = await db
          .insert(storeListings)
          .values({
            gameId: dbGame.id,
            storeId: store.id,
            storeUrl: game.storeUrl,
            storeGameId: game.storeGameId,
          })
          .returning();
      } else {
        await db
          .update(storeListings)
          .set({ storeUrl: game.storeUrl, storeGameId: game.storeGameId, updatedAt: new Date() })
          .where(eq(storeListings.id, listing.id));
      }

      if (!listing) continue;

      // Record price history
      await db.insert(priceHistory).values({
        storeListingId: listing.id,
        price: String(game.price),
        originalPrice: game.originalPrice != null ? String(game.originalPrice) : undefined,
        currency: game.currency,
        discount: game.discountPercent != null ? String(game.discountPercent) : undefined,
      });
    }
  }
}

/** @deprecated Use BaseScraper instead */
export type IScraper = BaseScraper;
