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
  price: {
    final: "$14.99",
    base: "$49.99",
    discount: "-70%",
    finalMoney: { amount: "14.99", currency: "USD" },
    baseMoney: { amount: "49.99", currency: "USD" },
  },
  coverHorizontal: "https://images.gog.com/witcher3_cover.jpg",
  coverVertical: "https://images.gog.com/witcher3_cover_v.jpg",
};

function makeCatalogPage(products = [mockProduct], pages = 1) {
  return { pages, products };
}

describe("GOGScraper", () => {
  let scraper: GOGScraper;

  beforeEach(() => {
    vi.clearAllMocks();
    scraper = new GOGScraper({ retailerDomain: "gog" });
  });

  describe("fetchGames()", () => {
    it("should return products from a single-page catalog response", async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(makeCatalogPage([mockProduct], 1)));

      const results = await scraper.fetchGames();
      expect(results).toHaveLength(1);
      // Only one fetch call needed — no per-product API calls
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should paginate through all pages when totalPages > 1", async () => {
      const product2 = { ...mockProduct, id: "9999999999", title: "Cyberpunk 2077", slug: "cyberpunk_2077" };

      mockFetch
        .mockResolvedValueOnce(makeResponse(makeCatalogPage([mockProduct], 2)))
        .mockResolvedValueOnce(makeResponse(makeCatalogPage([product2], 2)));

      const results = await scraper.fetchGames();
      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("normalizeGame()", () => {
    it("should return a ScrapedGame with storeSlug 'gog'", () => {
      const game = scraper.normalizeGame(mockProduct);
      expect(game.storeSlug).toBe("gog");
    });

    it("should return a ScrapedGame with currency 'USD'", () => {
      const game = scraper.normalizeGame(mockProduct);
      expect(game.currency).toBe("USD");
    });

    it("should set storeGameId to the GOG product ID string", () => {
      const game = scraper.normalizeGame(mockProduct);
      expect(game.storeGameId).toBe("1234567890");
    });

    it("should populate all required ScrapedGame fields", () => {
      const game = scraper.normalizeGame(mockProduct);
      expect(game.title).toBe("Witcher 3: Wild Hunt");
      expect(typeof game.slug).toBe("string");
      expect(game.slug.length).toBeGreaterThan(0);
      expect(game.storeUrl).toContain("gog.com");
      expect(typeof game.price).toBe("number");
    });

    it("should correctly parse discountPercent from catalog discount string", () => {
      const game = scraper.normalizeGame(mockProduct);
      expect(game.discountPercent).toBe(70);
    });

    it("should correctly parse dollar prices from finalMoney/baseMoney", () => {
      const game = scraper.normalizeGame(mockProduct);
      expect(game.price).toBe(14.99);
      expect(game.originalPrice).toBe(49.99);
    });

    it("should throw when price data is missing", () => {
      const noPrice = { ...mockProduct, price: undefined };
      expect(() => scraper.normalizeGame(noPrice)).toThrow();
    });

    it("should generate a URL-safe slug from the title", () => {
      const game = scraper.normalizeGame(mockProduct);
      expect(game.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it("should extract headerImageUrl from coverHorizontal", () => {
      const game = scraper.normalizeGame(mockProduct);
      expect(game.headerImageUrl).toBe("https://images.gog.com/witcher3_cover.jpg");
    });

    it("should fall back to coverVertical when coverHorizontal is absent", () => {
      const noCoverH = { ...mockProduct, coverHorizontal: undefined };
      const game = scraper.normalizeGame(noCoverH);
      expect(game.headerImageUrl).toBe("https://images.gog.com/witcher3_cover_v.jpg");
    });

    it("should return undefined headerImageUrl when no covers exist", () => {
      const noCovers = { ...mockProduct, coverHorizontal: undefined, coverVertical: undefined };
      const game = scraper.normalizeGame(noCovers);
      expect(game.headerImageUrl).toBeUndefined();
    });

    it("should parse prices from formatted strings when finalMoney is absent", () => {
      const noMoney = {
        ...mockProduct,
        price: { final: "$4.79", base: "$11.99", discount: "-60%" },
      };
      const game = scraper.normalizeGame(noMoney);
      expect(game.price).toBe(4.79);
      expect(game.originalPrice).toBe(11.99);
      expect(game.discountPercent).toBe(60);
    });
  });
});
