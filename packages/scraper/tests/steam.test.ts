import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @taad/db before importing SteamScraper
vi.mock("@taad/db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
  games: { slug: "slug_col" },
  stores: { slug: "slug_col" },
  storeListings: { gameId: "gameId_col", storeId: "storeId_col", id: "id_col" },
  priceHistory: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  and: vi.fn((...args: unknown[]) => args),
}));

import { SteamScraper } from "../src/steam.js";

// Sample canned responses
const FEATURED_CATEGORIES_RESPONSE = {
  specials: {
    items: [{ id: 220 }, { id: 440 }],
  },
  top_sellers: {
    items: [{ id: 730 }],
  },
};

const FEATURED_RESPONSE = {
  featured_win: [{ id: 570 }],
  featured_mac: [],
  featured_linux: [],
};

function makeAppDetailResponse(
  appId: number,
  overrides: Record<string, unknown> = {}
) {
  return {
    [String(appId)]: {
      success: true,
      data: {
        steam_appid: appId,
        name: "Half-Life 2",
        short_description: "A great game",
        header_image: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
        genres: [{ id: "1", description: "Action" }],
        price_overview: {
          currency: "USD",
          initial: 1999,
          final: 999,
          discount_percent: 50,
        },
        is_free: false,
        ...overrides,
      },
    },
  };
}

function makeFetchMock(responses: Record<string, unknown>) {
  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = url.toString();
    for (const [key, body] of Object.entries(responses)) {
      if (urlStr.includes(key)) {
        return {
          ok: true,
          status: 200,
          json: async () => body,
        } as Response;
      }
    }
    return { ok: false, status: 404, json: async () => ({}) } as Response;
  });
}

describe("SteamScraper", () => {
  let scraper: SteamScraper;

  beforeEach(() => {
    vi.clearAllMocks();
    scraper = new SteamScraper();
  });

  describe("fetchGames", () => {
    it("returns an array of raw app detail objects for on-sale games", async () => {
      const fetch = makeFetchMock({
        featuredcategories: FEATURED_CATEGORIES_RESPONSE,
        "api/featured": FEATURED_RESPONSE,
        "appdetails?appids=220": makeAppDetailResponse(220),
        "appdetails?appids=440": makeAppDetailResponse(440),
        "appdetails?appids=730": makeAppDetailResponse(730),
        "appdetails?appids=570": makeAppDetailResponse(570),
      });
      vi.stubGlobal("fetch", fetch);

      const results = await scraper.fetchGames();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it("skips free-to-play games (is_free=true)", async () => {
      const fetch = makeFetchMock({
        featuredcategories: { specials: { items: [{ id: 999 }] }, top_sellers: { items: [] } },
        "api/featured": { featured_win: [], featured_mac: [], featured_linux: [] },
        "appdetails?appids=999": {
          "999": {
            success: true,
            data: {
              steam_appid: 999,
              name: "Free Game",
              is_free: true,
              // no price_overview
            },
          },
        },
      });
      vi.stubGlobal("fetch", fetch);

      const results = await scraper.fetchGames();
      expect(results).toHaveLength(0);
    });

    it("skips games with no price_overview", async () => {
      const fetch = makeFetchMock({
        featuredcategories: { specials: { items: [{ id: 888 }] }, top_sellers: { items: [] } },
        "api/featured": { featured_win: [], featured_mac: [], featured_linux: [] },
        "appdetails?appids=888": {
          "888": {
            success: true,
            data: {
              steam_appid: 888,
              name: "No Price Game",
              is_free: false,
              // price_overview absent
            },
          },
        },
      });
      vi.stubGlobal("fetch", fetch);

      const results = await scraper.fetchGames();
      expect(results).toHaveLength(0);
    });
  });

  describe("normalizeGame", () => {
    const rawData = {
      steam_appid: 220,
      name: "Half-Life 2",
      short_description: "A great game",
      header_image: "https://cdn.akamai.steamstatic.com/steam/apps/220/header.jpg",
      genres: [{ id: "1", description: "Action" }, { id: "2", description: "FPS" }],
      price_overview: {
        currency: "USD",
        initial: 1999,
        final: 999,
        discount_percent: 50,
      },
      is_free: false,
    };

    it("converts cents to dollars for price and originalPrice", () => {
      const game = scraper.normalizeGame(rawData);
      expect(game.price).toBe(9.99);
      expect(game.originalPrice).toBe(19.99);
    });

    it("sets discountPercent correctly", () => {
      const game = scraper.normalizeGame(rawData);
      expect(game.discountPercent).toBe(50);
    });

    it("sets storeSlug to 'steam'", () => {
      const game = scraper.normalizeGame(rawData);
      expect(game.storeSlug).toBe("steam");
    });

    it("sets storeGameId to string app ID", () => {
      const game = scraper.normalizeGame(rawData);
      expect(game.storeGameId).toBe("220");
    });

    it("populates steamAppId", () => {
      const game = scraper.normalizeGame(rawData);
      expect(game.steamAppId).toBe(220);
    });

    it("populates description from short_description", () => {
      const game = scraper.normalizeGame(rawData);
      expect(game.description).toBe("A great game");
    });

    it("populates headerImageUrl", () => {
      const game = scraper.normalizeGame(rawData);
      expect(game.headerImageUrl).toBe(
        "https://cdn.akamai.steamstatic.com/steam/apps/220/header.jpg"
      );
    });

    it("populates genres as string array", () => {
      const game = scraper.normalizeGame(rawData);
      expect(game.genres).toEqual(["Action", "FPS"]);
    });

    it("constructs store URL as https://store.steampowered.com/app/{appid}", () => {
      const game = scraper.normalizeGame(rawData);
      expect(game.storeUrl).toBe("https://store.steampowered.com/app/220");
    });

    it("generates a slug from the game title", () => {
      const game = scraper.normalizeGame(rawData);
      expect(game.slug).toBe("half-life-2");
    });

    it("throws when price_overview is missing", () => {
      const noPrice = { ...rawData, price_overview: undefined };
      expect(() => scraper.normalizeGame(noPrice)).toThrow();
    });
  });
});
