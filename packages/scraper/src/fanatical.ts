import { eq, and } from "drizzle-orm";
import { db, games, stores, storeListings, priceHistory } from "@taad/db";
import { BaseScraper, ScrapedGame } from "./types.js";
import { buildReferralUrl } from "./referral.js";

interface FanaticalAlgoliaHit {
  name: string;
  slug: string;
  type?: string;
  price?: { USD?: number };
  fullPrice?: { USD?: number };
  discount?: number;
  steam_link?: string;
  end_time?: number;
}

interface FanaticalAlgoliaResponse {
  hits: FanaticalAlgoliaHit[];
  page: number;
  nbPages: number;
}

/** ScrapedGame extended with Fanatical-specific fields used during upsert. */
interface FanaticalGame extends ScrapedGame {
  steamAppId?: number;
  expiresAt?: Date;
}

const ALGOLIA_INDEX = "fan_alt_en_US_public";
const FANATICAL_BASE_URL = "https://www.fanatical.com/en";

export class FanaticalScraper extends BaseScraper {
  private readonly appId: string;
  private readonly searchKey: string;

  constructor() {
    const appId = process.env.FANATICAL_ALGOLIA_APP_ID;
    const searchKey = process.env.FANATICAL_ALGOLIA_SEARCH_KEY;

    if (!appId || !searchKey) {
      throw new Error("FANATICAL_ALGOLIA_APP_ID and FANATICAL_ALGOLIA_SEARCH_KEY must be set");
    }

    super({ retailerDomain: "fanatical.com", rateLimitRps: 5 });

    this.appId = appId;
    this.searchKey = searchKey;
  }

  /** Queries a single Algolia filter, fetching all pages. */
  private async queryAlgolia(filters: string): Promise<FanaticalAlgoliaHit[]> {
    const url = `https://${this.appId}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
    const headers = {
      "Content-Type": "application/json",
      "X-Algolia-Application-Id": this.appId,
      "X-Algolia-API-Key": this.searchKey,
    };

    const hits: FanaticalAlgoliaHit[] = [];
    let page = 0;
    let nbPages = 1;

    while (page < nbPages) {
      const res = await this.fetchWithRetry(() =>
        fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ filters, hitsPerPage: 200, page }),
        })
      );
      if (!res.ok) {
        throw new Error(`Algolia request failed: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as FanaticalAlgoliaResponse;
      hits.push(...data.hits);
      nbPages = data.nbPages;
      page++;
    }

    return hits;
  }

  /** Fetches on-sale games and bundles/star deals from Algolia, deduplicating by slug. */
  async fetchGames(): Promise<FanaticalAlgoliaHit[]> {
    const [onSaleHits, bundleHits] = await Promise.all([
      this.queryAlgolia("on_sale=1"),
      this.queryAlgolia("type:bundle"),
    ]);

    const seen = new Set<string>();
    const combined: FanaticalAlgoliaHit[] = [];
    for (const hit of [...onSaleHits, ...bundleHits]) {
      if (!seen.has(hit.slug)) {
        seen.add(hit.slug);
        combined.push(hit);
      }
    }
    return combined;
  }

  normalizeGame(raw: unknown): FanaticalGame {
    const hit = raw as FanaticalAlgoliaHit;
    const isBundle = hit.type === "bundle";
    const path = isBundle ? `bundle/${hit.slug}` : `game/${hit.slug}`;
    const storeUrl = buildReferralUrl(`${FANATICAL_BASE_URL}/${path}`, "fanatical");

    let steamAppId: number | undefined;
    if (hit.steam_link) {
      const match = /\/app\/(\d+)/.exec(hit.steam_link);
      if (match?.[1]) {
        steamAppId = parseInt(match[1], 10);
      }
    }

    let expiresAt: Date | undefined;
    if (hit.end_time) {
      expiresAt = new Date(hit.end_time * 1000);
    }

    return {
      title: hit.name,
      slug: hit.slug,
      storeUrl,
      price: hit.price?.USD ?? 0,
      originalPrice: hit.fullPrice?.USD,
      discountPercent: hit.discount,
      currency: "USD",
      storeSlug: "fanatical",
      storeGameId: hit.slug,
      steamAppId,
      expiresAt,
    };
  }

  /** Upserts games, matching by steamAppId first, then falling back to slug-based upsert. */
  override async upsertGames(scrapedGames: ScrapedGame[]): Promise<void> {
    for (const game of scrapedGames as FanaticalGame[]) {
      let gameId: string | undefined;

      // Prefer steamAppId match to avoid creating duplicate game records
      if (game.steamAppId != null) {
        const [existing] = await db
          .select()
          .from(games)
          .where(eq(games.steamAppId, game.steamAppId))
          .limit(1);
        if (existing) {
          await db
            .update(games)
            .set({ title: game.title, slug: game.slug, updatedAt: new Date() })
            .where(eq(games.id, existing.id));
          gameId = existing.id;
        }
      }

      if (!gameId) {
        // Slug-based upsert fallback
        await db
          .insert(games)
          .values({
            title: game.title,
            slug: game.slug,
            ...(game.steamAppId != null ? { steamAppId: game.steamAppId } : {}),
          })
          .onConflictDoUpdate({
            target: games.slug,
            set: { title: game.title, updatedAt: new Date() },
          });

        const [fetched] = await db
          .select()
          .from(games)
          .where(eq(games.slug, game.slug))
          .limit(1);
        gameId = fetched?.id;
      }

      if (!gameId) continue;

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
        .where(and(eq(storeListings.gameId, gameId), eq(storeListings.storeId, store.id)))
        .limit(1);

      if (!listing) {
        [listing] = await db
          .insert(storeListings)
          .values({
            gameId,
            storeId: store.id,
            storeUrl: game.storeUrl,
            storeGameId: game.storeGameId,
            ...(game.expiresAt ? { expiresAt: game.expiresAt } : {}),
          })
          .returning();
      } else {
        await db
          .update(storeListings)
          .set({
            storeUrl: game.storeUrl,
            storeGameId: game.storeGameId,
            updatedAt: new Date(),
            ...(game.expiresAt ? { expiresAt: game.expiresAt } : {}),
          })
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
