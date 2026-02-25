import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import EpicScraper, { type EpicRawItem } from "../../src/scrapers/epic.js";

// ─── Mock fetch ───────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Mock @taad/scraper ───────────────────────────────────────────────────────
vi.mock("@taad/scraper", () => {
  class BaseScraper {
    readonly retailerDomain: string;
    protected readonly headers: Record<string, string> = {};
    constructor(cfg: { retailerDomain: string }) {
      this.retailerDomain = cfg.retailerDomain;
    }
    protected async throttle() {}
    protected async fetchWithRetry(fn: () => Promise<Response>): Promise<Response> {
      return fn();
    }
  }
  return { BaseScraper };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────
function makeFreeElement(overrides: Partial<EpicRawItem> = {}): EpicRawItem {
  return {
    id: "free-game-id",
    title: "Free Game",
    productSlug: "free-game",
    urlSlug: "free-game",
    price: {
      totalPrice: {
        discountPrice: 0,
        originalPrice: 1999,
        discount: 1999,
        currencyCode: "USD",
      },
    },
    promotions: {
      promotionalOffers: [
        {
          promotionalOffers: [
            { startDate: "2025-06-01T15:00:00.000Z", endDate: "2025-06-15T15:00:00.000Z" },
          ],
        },
      ],
    },
    _isFree: true,
    ...overrides,
  };
}

function makeSaleElement(overrides: Partial<EpicRawItem> = {}): EpicRawItem {
  return {
    id: "sale-game-id",
    title: "Sale Game",
    productSlug: "sale-game",
    urlSlug: "sale-game",
    price: {
      totalPrice: {
        discountPrice: 999,
        originalPrice: 2999,
        discount: 2000,
        currencyCode: "USD",
      },
    },
    promotions: null,
    _isFree: false,
    ...overrides,
  };
}

function makeFreeApiResponse(elements: EpicRawItem[]) {
  return {
    data: { Catalog: { searchStore: { elements } } },
  };
}

function makeGraphqlResponse(elements: EpicRawItem[], total: number) {
  return {
    data: {
      Catalog: {
        searchStore: {
          elements,
          paging: { count: elements.length, total },
        },
      },
    },
  };
}

function mockJsonResponse(body: unknown) {
  return Promise.resolve({
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("EpicScraper", () => {
  let scraper: EpicScraper;

  beforeEach(() => {
    scraper = new EpicScraper({ retailerDomain: "epic-games" });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("is the default export and extends BaseScraper", async () => {
    const { BaseScraper } = await import("@taad/scraper");
    expect(scraper).toBeInstanceOf(BaseScraper);
  });

  describe("fetchGames()", () => {
    it("returns items from both the freeGamesPromotions endpoint and the GraphQL catalog", async () => {
      const freeEl = makeFreeElement();
      const saleEl = makeSaleElement();

      mockFetch
        .mockResolvedValueOnce(mockJsonResponse(makeFreeApiResponse([freeEl])) as unknown as Response)
        .mockResolvedValueOnce(
          mockJsonResponse(makeGraphqlResponse([saleEl], 1)) as unknown as Response,
        );

      const results = await scraper.fetchGames();
      expect(results).toHaveLength(2);
      expect(results[0]._isFree).toBe(true);
      expect(results[1]._isFree).toBe(false);
    });

    it("handles pagination by fetching multiple pages", async () => {
      const freeEl = makeFreeElement();
      const page1El = makeSaleElement({ id: "p1" });
      const page2El = makeSaleElement({ id: "p2", title: "Page 2 Game", productSlug: "page-2-game" });

      mockFetch
        .mockResolvedValueOnce(mockJsonResponse(makeFreeApiResponse([freeEl])) as unknown as Response)
        .mockResolvedValueOnce(
          // First GraphQL page: 1 element, total = 2
          mockJsonResponse(makeGraphqlResponse([page1El], 2)) as unknown as Response,
        )
        .mockResolvedValueOnce(
          // Second GraphQL page: 1 element, total = 2
          mockJsonResponse(makeGraphqlResponse([page2El], 2)) as unknown as Response,
        );

      const results = await scraper.fetchGames();
      expect(results).toHaveLength(3); // 1 free + 2 catalog
      expect(mockFetch).toHaveBeenCalledTimes(3); // REST + 2 GraphQL pages
    });
  });

  describe("normalizeGame()", () => {
    it("converts discountPrice and originalPrice from cents to dollars for a paid-on-sale game", () => {
      const raw = makeSaleElement();
      const normalized = scraper.normalizeGame(raw);

      expect(normalized.price).toBe(9.99); // 999 cents → $9.99
      expect(normalized.originalPrice).toBe(29.99); // 2999 cents → $29.99
      expect(normalized.storeSlug).toBe("epic-games");
    });

    it("sets price = 0 and populates saleEndsAt for a free game", () => {
      const raw = makeFreeElement();
      const normalized = scraper.normalizeGame(raw);

      expect(normalized.price).toBe(0);
      expect(normalized.saleEndsAt).toBe("2025-06-15T15:00:00.000Z");
      expect(normalized.storeSlug).toBe("epic-games");
    });

    it("sets storeSlug to 'epic-games' on all normalized games", () => {
      expect(scraper.normalizeGame(makeFreeElement()).storeSlug).toBe("epic-games");
      expect(scraper.normalizeGame(makeSaleElement()).storeSlug).toBe("epic-games");
    });

    it("uses storeGameId from raw item id", () => {
      const raw = makeSaleElement({ id: "my-unique-id" });
      expect(scraper.normalizeGame(raw).storeGameId).toBe("my-unique-id");
    });

    it("generates a URL-safe slug from the game title", () => {
      const raw = makeSaleElement({ title: "Halo: Infinite" });
      expect(scraper.normalizeGame(raw).slug).toBe("halo-infinite");
    });

    it("falls back to urlSlug when productSlug is null", () => {
      const raw = makeSaleElement({ productSlug: null, urlSlug: "url-slug-game" });
      const normalized = scraper.normalizeGame(raw);
      expect(normalized.storeUrl).toContain("url-slug-game");
    });

    it("computes discountPercent correctly", () => {
      // original: $29.99, sale: $9.99 → ~67% off
      const raw = makeSaleElement();
      const normalized = scraper.normalizeGame(raw);
      expect(normalized.discountPercent).toBe(67);
    });

    it("sets saleEndsAt to null when no promotions exist", () => {
      const raw = makeSaleElement({ promotions: null });
      const normalized = scraper.normalizeGame(raw);
      expect(normalized.saleEndsAt).toBeNull();
    });
  });
});
