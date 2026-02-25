import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ScrapedGame } from "../src/types.js";

// Mock @taad/db before importing BaseScraper so module resolution uses the mock
vi.mock("@taad/db", () => {
  const mockDb = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  };
  return {
    db: mockDb,
    games: { slug: "slug_col" },
    stores: { slug: "slug_col" },
    storeListings: { gameId: "gameId_col", storeId: "storeId_col", id: "id_col" },
    priceHistory: {},
  };
});

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  and: vi.fn((...args: unknown[]) => args),
}));

import { BaseScraper, type ScraperConfig } from "../src/types.js";
import { db } from "@taad/db";

// Concrete subclass for testing
class TestScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config);
  }
  async fetchGames(): Promise<unknown[]> {
    return [];
  }
  normalizeGame(raw: unknown): ScrapedGame {
    return raw as ScrapedGame;
  }
}

const validGame: ScrapedGame = {
  title: "Test Game",
  slug: "test-game",
  storeUrl: "https://store.steampowered.com/app/1",
  price: 9.99,
  originalPrice: 19.99,
  discountPercent: 50,
  currency: "USD",
  storeSlug: "steam",
  storeGameId: "1",
};

describe("BaseScraper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("constructor", () => {
    it("should store retailerDomain", () => {
      const scraper = new TestScraper({ retailerDomain: "example.com" });
      expect(scraper.retailerDomain).toBe("example.com");
    });

    it("should default maxRetries to 3", async () => {
      const scraper = new TestScraper({ retailerDomain: "example.com" });
      let callCount = 0;
      const fn = vi.fn(async () => {
        callCount++;
        return { status: 500 } as Response;
      });
      const promise = scraper["fetchWithRetry"](fn);
      const assertion = expect(promise).rejects.toThrow("HTTP 500");
      await vi.runAllTimersAsync();
      await assertion;
      // attempt 0, 1, 2, 3 = 4 total calls (maxRetries=3 means attempt <= 3)
      expect(callCount).toBe(4);
    });

    it("should accept custom maxRetries", async () => {
      const scraper = new TestScraper({ retailerDomain: "example.com", maxRetries: 1 });
      let callCount = 0;
      const fn = vi.fn(async () => {
        callCount++;
        return { status: 503 } as Response;
      });
      const promise = scraper["fetchWithRetry"](fn);
      const assertion = expect(promise).rejects.toThrow("HTTP 503");
      await vi.runAllTimersAsync();
      await assertion;
      expect(callCount).toBe(2);
    });
  });

  describe("fetchWithRetry", () => {
    it("should return response immediately on 2xx", async () => {
      const scraper = new TestScraper({ retailerDomain: "example.com" });
      const mockResponse = { status: 200, ok: true } as Response;
      const fn = vi.fn(async () => mockResponse);
      const result = await scraper["fetchWithRetry"](fn);
      expect(result).toBe(mockResponse);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on 5xx and eventually throw", async () => {
      const scraper = new TestScraper({ retailerDomain: "example.com", maxRetries: 2 });
      const fn = vi.fn(async () => ({ status: 503 }) as Response);
      const promise = scraper["fetchWithRetry"](fn);
      const assertion = expect(promise).rejects.toThrow("HTTP 503");
      await vi.runAllTimersAsync();
      await assertion;
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should retry on network error and eventually rethrow", async () => {
      const scraper = new TestScraper({ retailerDomain: "example.com", maxRetries: 1 });
      const networkError = new Error("Network failure");
      const fn = vi.fn(async () => { throw networkError; });
      const promise = scraper["fetchWithRetry"](fn);
      const assertion = expect(promise).rejects.toThrow("Network failure");
      await vi.runAllTimersAsync();
      await assertion;
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should succeed on a retry after a 5xx", async () => {
      const scraper = new TestScraper({ retailerDomain: "example.com", maxRetries: 2 });
      const okResponse = { status: 200 } as Response;
      const fn = vi.fn()
        .mockResolvedValueOnce({ status: 500 } as Response)
        .mockResolvedValueOnce(okResponse);
      const promise = scraper["fetchWithRetry"](fn);
      await vi.runAllTimersAsync();
      const result = await promise;
      expect(result).toBe(okResponse);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("upsertGames", () => {
    function buildDbChain(returnValue: unknown) {
      const chain = {
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(returnValue),
        returning: vi.fn().mockResolvedValue(returnValue),
      };
      return chain;
    }

    it("should skip game when store is not found", async () => {
      const mockDb = db as ReturnType<typeof vi.fn> & typeof db;

      const insertChain = buildDbChain([{ id: 1, slug: "test-game" }]);
      const selectForGame = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-game" }]) };
      const selectForStore = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([]) }; // store not found

      (mockDb.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);
      (mockDb.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(selectForGame)
        .mockReturnValueOnce(selectForStore);

      const scraper = new TestScraper({ retailerDomain: "steam.com" });
      // Should not throw even when store not found
      await expect(scraper.upsertGames([validGame])).resolves.toBeUndefined();
    });

    it("should skip game when game record not found after insert", async () => {
      const mockDb = db as ReturnType<typeof vi.fn> & typeof db;

      const insertChain = buildDbChain([]);
      const selectForGame = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([]) }; // game not found

      (mockDb.insert as ReturnType<typeof vi.fn>).mockReturnValue(insertChain);
      (mockDb.select as ReturnType<typeof vi.fn>).mockReturnValue(selectForGame);

      const scraper = new TestScraper({ retailerDomain: "steam.com" });
      await expect(scraper.upsertGames([validGame])).resolves.toBeUndefined();
    });

    it("should process empty array without error", async () => {
      const scraper = new TestScraper({ retailerDomain: "steam.com" });
      await expect(scraper.upsertGames([])).resolves.toBeUndefined();
      expect((db.insert as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
    });

    it("should include saleEndsAt as a Date in priceHistory insert when provided", async () => {
      const mockDb = db as ReturnType<typeof vi.fn> & typeof db;

      const saleGame: ScrapedGame = { ...validGame, saleEndsAt: "2025-12-31T23:59:59.000Z" };

      const listingInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 99 }]),
      };
      const gameInsertChain = {
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-game" }]),
        returning: vi.fn().mockResolvedValue([{ id: 1, slug: "test-game" }]),
      };

      const selectForGame = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-game" }]) };
      const selectForStore = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([{ id: 2, slug: "steam" }]) };
      const selectForListing = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([]) };

      const priceHistoryInsertChain = { values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{}]) };

      (mockDb.insert as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(gameInsertChain)
        .mockReturnValueOnce(listingInsertChain)
        .mockReturnValueOnce(priceHistoryInsertChain);

      (mockDb.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(selectForGame)
        .mockReturnValueOnce(selectForStore)
        .mockReturnValueOnce(selectForListing);

      const scraper = new TestScraper({ retailerDomain: "steam.com" });
      await scraper.upsertGames([saleGame]);

      const phValuesArg = priceHistoryInsertChain.values.mock.calls[0]?.[0] as { saleEndsAt?: Date } | undefined;
      expect(phValuesArg?.saleEndsAt).toBeInstanceOf(Date);
      expect(phValuesArg?.saleEndsAt?.toISOString()).toBe("2025-12-31T23:59:59.000Z");
    });

    it("should omit saleEndsAt from priceHistory insert when not provided", async () => {
      const mockDb = db as ReturnType<typeof vi.fn> & typeof db;

      const listingInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 99 }]),
      };
      const gameInsertChain = {
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-game" }]),
        returning: vi.fn().mockResolvedValue([{ id: 1, slug: "test-game" }]),
      };

      const selectForGame = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-game" }]) };
      const selectForStore = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([{ id: 2, slug: "steam" }]) };
      const selectForListing = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([]) };

      const priceHistoryInsertChain = { values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{}]) };

      (mockDb.insert as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(gameInsertChain)
        .mockReturnValueOnce(listingInsertChain)
        .mockReturnValueOnce(priceHistoryInsertChain);

      (mockDb.select as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(selectForGame)
        .mockReturnValueOnce(selectForStore)
        .mockReturnValueOnce(selectForListing);

      const scraper = new TestScraper({ retailerDomain: "steam.com" });
      // validGame has no saleEndsAt
      await scraper.upsertGames([validGame]);

      const phValuesArg = priceHistoryInsertChain.values.mock.calls[0]?.[0] as { saleEndsAt?: Date } | undefined;
      expect(phValuesArg?.saleEndsAt).toBeUndefined();
    });

    it("should apply referral URL when inserting a new store listing with affiliate env var set", async () => {
      const mockDb = db as ReturnType<typeof vi.fn> & typeof db;
      const originalTag = process.env.STEAM_AFFILIATE_TAG;
      process.env.STEAM_AFFILIATE_TAG = "testpartner";

      try {
        const listingInsertChain = {
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{ id: 99 }]),
        };
        const gameInsertChain = {
          values: vi.fn().mockReturnThis(),
          onConflictDoUpdate: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-game" }]),
          returning: vi.fn().mockResolvedValue([{ id: 1, slug: "test-game" }]),
        };

        const selectForGame = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([{ id: 1, slug: "test-game" }]) };
        const selectForStore = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([{ id: 2, slug: "steam" }]) };
        const selectForListing = { from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue([]) }; // no existing listing

        const priceHistoryInsertChain = { values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{}]) };

        (mockDb.insert as ReturnType<typeof vi.fn>)
          .mockReturnValueOnce(gameInsertChain)
          .mockReturnValueOnce(listingInsertChain)
          .mockReturnValueOnce(priceHistoryInsertChain);

        (mockDb.select as ReturnType<typeof vi.fn>)
          .mockReturnValueOnce(selectForGame)
          .mockReturnValueOnce(selectForStore)
          .mockReturnValueOnce(selectForListing);

        const scraper = new TestScraper({ retailerDomain: "steam.com" });
        await scraper.upsertGames([validGame]);

        // Verify that the storeUrl passed to the listing insert includes the referral param
        const listingValuesArg = listingInsertChain.values.mock.calls[0]?.[0] as { storeUrl: string } | undefined;
        expect(listingValuesArg?.storeUrl).toContain("partner=testpartner");
      } finally {
        if (originalTag !== undefined) {
          process.env.STEAM_AFFILIATE_TAG = originalTag;
        } else {
          delete process.env.STEAM_AFFILIATE_TAG;
        }
      }
    });
  });

});
