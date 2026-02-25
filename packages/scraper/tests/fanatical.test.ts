import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @taad/db to avoid DATABASE_URL requirement at import time
vi.mock("@taad/db", () => ({
  db: { insert: vi.fn(), select: vi.fn(), update: vi.fn() },
  games: {},
  stores: {},
  storeListings: {},
  priceHistory: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

import { FanaticalScraper } from "../src/fanatical.js";

describe("FanaticalScraper", () => {
  let scraper: FanaticalScraper;

  beforeEach(() => {
    process.env.FANATICAL_ALGOLIA_APP_ID = "TESTAPPID";
    process.env.FANATICAL_ALGOLIA_SEARCH_KEY = "TEST_SEARCH_KEY";
    scraper = new FanaticalScraper();
  });

  afterEach(() => {
    delete process.env.FANATICAL_ALGOLIA_APP_ID;
    delete process.env.FANATICAL_ALGOLIA_SEARCH_KEY;
    delete process.env.FANATICAL_REF;
    vi.unstubAllGlobals();
  });

  describe("constructor", () => {
    it("throws when FANATICAL_ALGOLIA_APP_ID is missing", () => {
      delete process.env.FANATICAL_ALGOLIA_APP_ID;
      expect(() => new FanaticalScraper()).toThrow();
    });

    it("throws when FANATICAL_ALGOLIA_SEARCH_KEY is missing", () => {
      delete process.env.FANATICAL_ALGOLIA_SEARCH_KEY;
      expect(() => new FanaticalScraper()).toThrow();
    });
  });

  describe("normalizeGame()", () => {
    it("normalizes a standard on-sale game hit", () => {
      const hit = {
        name: "Cool Game",
        slug: "cool-game",
        type: "game",
        price: { USD: 9.99 },
        fullPrice: { USD: 19.99 },
        discount: 50,
      };

      const result = scraper.normalizeGame(hit);

      expect(result.title).toBe("Cool Game");
      expect(result.slug).toBe("cool-game");
      expect(result.price).toBe(9.99);
      expect(result.originalPrice).toBe(19.99);
      expect(result.discountPercent).toBe(50);
      expect(result.currency).toBe("USD");
      expect(result.storeSlug).toBe("fanatical");
      expect(result.storeGameId).toBe("cool-game");
      expect(result.storeUrl).toContain("game/cool-game");
    });

    it("normalizes a bundle hit (type:bundle) with an expiry date", () => {
      const endTime = Math.floor(Date.now() / 1000) + 86400; // 24h from now
      const hit = {
        name: "Awesome Bundle",
        slug: "awesome-bundle",
        type: "bundle",
        price: { USD: 4.99 },
        fullPrice: { USD: 49.99 },
        discount: 90,
        end_time: endTime,
      };

      const result = scraper.normalizeGame(hit) as ReturnType<typeof scraper.normalizeGame> & {
        expiresAt?: Date;
      };

      expect(result.title).toBe("Awesome Bundle");
      expect(result.storeUrl).toContain("bundle/awesome-bundle");
      expect(result.price).toBe(4.99);
      expect(result.discountPercent).toBe(90);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt?.getTime()).toBe(endTime * 1000);
    });

    it("extracts steamAppId from steam_link field", () => {
      const hit = {
        name: "Steam Game",
        slug: "steam-game",
        type: "game",
        price: { USD: 5.99 },
        steam_link: "https://store.steampowered.com/app/12345",
      };

      const result = scraper.normalizeGame(hit) as ReturnType<typeof scraper.normalizeGame> & {
        steamAppId?: number;
      };

      expect(result.steamAppId).toBe(12345);
    });

    it("does not set steamAppId when steam_link is absent", () => {
      const hit = {
        name: "No Steam Game",
        slug: "no-steam-game",
        type: "game",
        price: { USD: 5.99 },
      };

      const result = scraper.normalizeGame(hit) as ReturnType<typeof scraper.normalizeGame> & {
        steamAppId?: number;
      };

      expect(result.steamAppId).toBeUndefined();
    });

    it("does not set expiresAt when end_time is absent", () => {
      const hit = {
        name: "No Expiry Game",
        slug: "no-expiry-game",
        type: "game",
        price: { USD: 9.99 },
      };

      const result = scraper.normalizeGame(hit) as ReturnType<typeof scraper.normalizeGame> & {
        expiresAt?: Date;
      };

      expect(result.expiresAt).toBeUndefined();
    });

    it("appends affiliate referral URL via buildReferralUrl when FANATICAL_REF is set", () => {
      process.env.FANATICAL_REF = "myref";
      const hit = {
        name: "Referral Game",
        slug: "referral-game",
        type: "game",
        price: { USD: 9.99 },
      };

      const result = scraper.normalizeGame(hit);

      expect(result.storeUrl).toContain("ref=myref");
    });

    it("returns storeUrl without ref param when FANATICAL_REF is not set", () => {
      delete process.env.FANATICAL_REF;
      const hit = {
        name: "No Ref Game",
        slug: "no-ref-game",
        type: "game",
        price: { USD: 9.99 },
      };

      const result = scraper.normalizeGame(hit);

      expect(result.storeUrl).not.toContain("ref=");
      expect(result.storeUrl).toContain("fanatical.com/en/game/no-ref-game");
    });
  });

  describe("fetchGames()", () => {
    it("fetches on-sale games and bundles from Algolia, deduplicating by slug", async () => {
      const onSaleHit = { name: "On Sale Game", slug: "on-sale-game", type: "game", price: { USD: 9.99 } };
      const bundleHit = { name: "My Bundle", slug: "my-bundle", type: "bundle", price: { USD: 4.99 } };

      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ hits: [onSaleHit], page: 0, nbPages: 1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ hits: [bundleHit], page: 0, nbPages: 1 }),
        });

      vi.stubGlobal("fetch", mockFetch);

      const hits = await scraper.fetchGames();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(hits).toHaveLength(2);
      expect(hits.map((h) => h.slug)).toContain("on-sale-game");
      expect(hits.map((h) => h.slug)).toContain("my-bundle");
    });

    it("handles pagination by fetching all pages", async () => {
      const page0Hit = { name: "Game Page 0", slug: "game-page-0", type: "game", price: { USD: 9.99 } };
      const page1Hit = { name: "Game Page 1", slug: "game-page-1", type: "game", price: { USD: 5.99 } };

      // Use a request-body-aware mock so response order is independent of throttle timing
      const mockFetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string) as { filters: string; page: number };
        if (body.filters === "on_sale=1") {
          if (body.page === 0) return Promise.resolve({ ok: true, status: 200, json: async () => ({ hits: [page0Hit], page: 0, nbPages: 2 }) });
          if (body.page === 1) return Promise.resolve({ ok: true, status: 200, json: async () => ({ hits: [page1Hit], page: 1, nbPages: 2 }) });
        }
        // type:bundle: one page (no results)
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ hits: [], page: 0, nbPages: 1 }) });
      });

      vi.stubGlobal("fetch", mockFetch);

      const hits = await scraper.fetchGames();

      // 3 total fetch calls: 2 for on_sale pages + 1 for bundles
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(hits).toHaveLength(2);
    });

    it("deduplicates hits that appear in both on-sale and bundle results", async () => {
      const sharedHit = { name: "Bundle On Sale", slug: "bundle-on-sale", type: "bundle", price: { USD: 4.99 } };

      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ hits: [sharedHit], page: 0, nbPages: 1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ hits: [sharedHit], page: 0, nbPages: 1 }),
        });

      vi.stubGlobal("fetch", mockFetch);

      const hits = await scraper.fetchGames();

      expect(hits).toHaveLength(1);
    });

    it("POSTs to the correct Algolia endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ hits: [], page: 0, nbPages: 1 }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await scraper.fetchGames();

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://TESTAPPID-dsn.algolia.net/1/indexes/fan_alt_en_US_public/query");
    });
  });
});
