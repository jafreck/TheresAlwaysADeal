import { describe, it, expect, vi, beforeEach } from "vitest";

// Must be mocked before importing GOGScraper to prevent @taad/db from requiring DATABASE_URL
vi.mock("@taad/db", () => ({
  db: {},
  games: {},
  stores: {},
  storeListings: {},
  priceHistory: {},
}));

import GOGScraper from "../../src/scrapers/gog.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeResponse(body: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const mockProduct = {
  id: "1234567890",
  title: "Witcher 3: Wild Hunt",
  slug: "witcher_3_wild_hunt",
};

function makeCatalogPage(products = [mockProduct], pages = 1) {
  return { pages, products };
}

const mockProductDetails = {
  id: 1234567890,
  title: "Witcher 3: Wild Hunt",
  slug: "witcher_3_wild_hunt",
  _embedded: {
    prices: {
      items: [
        {
          basePrice: "4999",
          finalPrice: "1499",
          discount: "70",
        },
      ],
    },
  },
};

describe("GOGScraper", () => {
  let scraper: GOGScraper;

  beforeEach(() => {
    vi.clearAllMocks();
    scraper = new GOGScraper({ retailerDomain: "gog" });
  });

  describe("fetchGames()", () => {
    it("should return an array with one item for a single-page response", async () => {
      mockFetch
        .mockResolvedValueOnce(makeResponse(makeCatalogPage([mockProduct], 1)))
        .mockResolvedValueOnce(makeResponse(mockProductDetails));

      const results = await scraper.fetchGames();
      expect(results).toHaveLength(1);
    });

    it("should paginate through all pages when totalPages > 1", async () => {
      const product2 = { id: "9999999999", title: "Cyberpunk 2077", slug: "cyberpunk_2077" };
      const details2 = {
        ...mockProductDetails,
        id: 9999999999,
        title: "Cyberpunk 2077",
        slug: "cyberpunk_2077",
      };

      mockFetch
        // page 1 catalog
        .mockResolvedValueOnce(makeResponse(makeCatalogPage([mockProduct], 2)))
        // page 1 product details
        .mockResolvedValueOnce(makeResponse(mockProductDetails))
        // page 2 catalog
        .mockResolvedValueOnce(makeResponse(makeCatalogPage([product2], 2)))
        // page 2 product details
        .mockResolvedValueOnce(makeResponse(details2));

      const results = await scraper.fetchGames();
      expect(results).toHaveLength(2);
    });

    it("should skip products that fail to fetch pricing details", async () => {
      // Use maxRetries: 0 to avoid exponential backoff delays in tests
      const noRetryScraper = new GOGScraper({ retailerDomain: "gog", maxRetries: 0 });
      mockFetch
        .mockResolvedValueOnce(makeResponse(makeCatalogPage([mockProduct], 1)))
        .mockRejectedValueOnce(new Error("Network error"));

      const results = await noRetryScraper.fetchGames();
      expect(results).toHaveLength(0);
    });
  });

  describe("normalizeGame()", () => {
    const rawItem = {
      catalog: mockProduct,
      details: mockProductDetails,
    };

    it("should return a ScrapedGame with storeSlug 'gog'", () => {
      const game = scraper.normalizeGame(rawItem);
      expect(game.storeSlug).toBe("gog");
    });

    it("should return a ScrapedGame with currency 'USD'", () => {
      const game = scraper.normalizeGame(rawItem);
      expect(game.currency).toBe("USD");
    });

    it("should set storeGameId to the GOG product ID string", () => {
      const game = scraper.normalizeGame(rawItem);
      expect(game.storeGameId).toBe("1234567890");
    });

    it("should populate all required ScrapedGame fields", () => {
      const game = scraper.normalizeGame(rawItem);
      expect(game.title).toBe("Witcher 3: Wild Hunt");
      expect(typeof game.slug).toBe("string");
      expect(game.slug.length).toBeGreaterThan(0);
      expect(game.storeUrl).toContain("gog.com");
      expect(typeof game.price).toBe("number");
    });

    it("should correctly compute discountPercent from GOG price response", () => {
      const game = scraper.normalizeGame(rawItem);
      expect(game.discountPercent).toBe(70);
    });

    it("should correctly convert cent-string prices to decimal numbers", () => {
      const game = scraper.normalizeGame(rawItem);
      expect(game.price).toBe(14.99);
      expect(game.originalPrice).toBe(49.99);
    });

    it("should throw when price data is missing", () => {
      const rawNoPrice = {
        catalog: mockProduct,
        details: { ...mockProductDetails, _embedded: undefined },
      };
      expect(() => scraper.normalizeGame(rawNoPrice)).toThrow();
    });

    it("should generate a URL-safe slug from the title", () => {
      const game = scraper.normalizeGame(rawItem);
      expect(game.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });
});
