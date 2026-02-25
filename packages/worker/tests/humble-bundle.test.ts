import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @taad/db before importing HumbleScraper (BaseScraper depends on it)
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

import HumbleScraper from "../src/scrapers/humble-bundle.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const rawSaleItem = {
  _type: "sale" as const,
  machine_name: "portal-2",
  human_name: "Portal 2",
  current_price: { amount: 4.99, currency: "USD" },
  full_price: { amount: 19.99 },
  discount_percent: 75,
  human_url: "https://www.humblebundle.com/store/portal-2",
  choice_eligible: false,
};

const rawChoiceItem = {
  _type: "sale" as const,
  machine_name: "stardew-valley",
  human_name: "Stardew Valley",
  current_price: { amount: 0, currency: "USD" },
  full_price: { amount: 14.99 },
  discount_percent: 100,
  human_url: "https://www.humblebundle.com/store/stardew-valley",
  choice_eligible: true,
};

const rawBundleItem = {
  _type: "bundle" as const,
  machine_name: "humble-monthly-2024-02",
  tile_name: "Humble Choice: February 2024",
  mosaic_url: "https://www.humblebundle.com/subscription/february-2024",
  pricing: {
    minimum: { amount: 11.99 },
  },
};

describe("HumbleScraper", () => {
  let scraper: HumbleScraper;

  beforeEach(() => {
    scraper = new HumbleScraper();
  });

  describe("retailerDomain", () => {
    it("should be 'humble-bundle'", () => {
      expect(scraper.retailerDomain).toBe("humble-bundle");
    });
  });

  describe("normalizeGame() – sale item", () => {
    it("maps human_name to title", () => {
      const game = scraper.normalizeGame(rawSaleItem);
      expect(game.title).toBe("Portal 2");
    });

    it("stores price as a dollar float", () => {
      const game = scraper.normalizeGame(rawSaleItem);
      expect(game.price).toBe(4.99);
    });

    it("stores originalPrice as a dollar float", () => {
      const game = scraper.normalizeGame(rawSaleItem);
      expect(game.originalPrice).toBe(19.99);
    });

    it("stores discountPercent", () => {
      const game = scraper.normalizeGame(rawSaleItem);
      expect(game.discountPercent).toBe(75);
    });

    it("sets storeSlug to 'humble-bundle'", () => {
      const game = scraper.normalizeGame(rawSaleItem);
      expect(game.storeSlug).toBe("humble-bundle");
    });

    it("preserves the store URL", () => {
      const game = scraper.normalizeGame(rawSaleItem);
      expect(game.storeUrl).toBe("https://www.humblebundle.com/store/portal-2");
    });

    it("sets choiceIncluded to undefined when choice_eligible is false", () => {
      const game = scraper.normalizeGame(rawSaleItem);
      expect(game.choiceIncluded).toBeUndefined();
    });

    it("sets storeGameId to machine_name", () => {
      const game = scraper.normalizeGame(rawSaleItem);
      expect(game.storeGameId).toBe("portal-2");
    });
  });

  describe("normalizeGame() – Humble Choice item", () => {
    it("sets choiceIncluded to true when choice_eligible is true", () => {
      const game = scraper.normalizeGame(rawChoiceItem);
      expect(game.choiceIncluded).toBe(true);
    });

    it("still sets storeSlug to 'humble-bundle'", () => {
      const game = scraper.normalizeGame(rawChoiceItem);
      expect(game.storeSlug).toBe("humble-bundle");
    });

    it("stores price as a dollar float", () => {
      const game = scraper.normalizeGame(rawChoiceItem);
      expect(typeof game.price).toBe("number");
      expect(game.price).toBe(0);
    });
  });

  describe("normalizeGame() – bundle item", () => {
    it("uses tile_name as the game title", () => {
      const game = scraper.normalizeGame(rawBundleItem);
      expect(game.title).toBe("Humble Choice: February 2024");
    });

    it("uses minimum price as dollar-float price", () => {
      const game = scraper.normalizeGame(rawBundleItem);
      expect(game.price).toBe(11.99);
    });

    it("sets storeSlug to 'humble-bundle'", () => {
      const game = scraper.normalizeGame(rawBundleItem);
      expect(game.storeSlug).toBe("humble-bundle");
    });

    it("sets storeUrl to the mosaic URL", () => {
      const game = scraper.normalizeGame(rawBundleItem);
      expect(game.storeUrl).toBe(
        "https://www.humblebundle.com/subscription/february-2024",
      );
    });

    it("sets storeGameId to machine_name", () => {
      const game = scraper.normalizeGame(rawBundleItem);
      expect(game.storeGameId).toBe("humble-monthly-2024-02");
    });
  });

  describe("storeSlug and referral URL", () => {
    it("normalizeGame() always returns storeSlug 'humble-bundle' (enables buildReferralUrl lookup)", () => {
      const saleGame = scraper.normalizeGame(rawSaleItem);
      const bundleGame = scraper.normalizeGame(rawBundleItem);
      const choiceGame = scraper.normalizeGame(rawChoiceItem);
      expect(saleGame.storeSlug).toBe("humble-bundle");
      expect(bundleGame.storeSlug).toBe("humble-bundle");
      expect(choiceGame.storeSlug).toBe("humble-bundle");
    });

    it("applies referral URL via storeSlug when HUMBLE_PARTNER_ID env var is set", async () => {
      const original = process.env.HUMBLE_PARTNER_ID;
      process.env.HUMBLE_PARTNER_ID = "testpartner";
      try {
        const { buildReferralUrl } = await import("@taad/scraper");
        const game = scraper.normalizeGame(rawSaleItem);
        const referralUrl = buildReferralUrl(game.storeUrl, game.storeSlug);
        expect(referralUrl).toContain("partner=testpartner");
      } finally {
        if (original !== undefined) {
          process.env.HUMBLE_PARTNER_ID = original;
        } else {
          delete process.env.HUMBLE_PARTNER_ID;
        }
      }
    });
  });

  describe("fetchGames()", () => {
    it("fetches from the sale endpoint and mosaic endpoint and combines results", async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              results: [
                {
                  machine_name: "portal-2",
                  human_name: "Portal 2",
                  current_price: { amount: 4.99, currency: "USD" },
                  full_price: { amount: 19.99 },
                  discount_percent: 75,
                  human_url: "https://www.humblebundle.com/store/portal-2",
                  choice_eligible: false,
                },
              ],
            }),
          status: 200,
        } as unknown as Response)
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              data: [
                {
                  machine_name: "humble-bundle-feb-2024",
                  tile_name: "Humble Choice February",
                  mosaic_url: "https://www.humblebundle.com/subscription/feb-2024",
                  pricing: { minimum: { amount: 11.99 } },
                },
              ],
            }),
          status: 200,
        } as unknown as Response);

      vi.stubGlobal("fetch", mockFetch);
      try {
        const results = await scraper.fetchGames();
        expect(results).toHaveLength(2);
        const [saleItem, bundleItem] = results as Array<{
          _type: string;
          machine_name: string;
        }>;
        expect(saleItem._type).toBe("sale");
        expect(bundleItem._type).toBe("bundle");
        expect(saleItem.machine_name).toBe("portal-2");
        expect(bundleItem.machine_name).toBe("humble-bundle-feb-2024");
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });
});
