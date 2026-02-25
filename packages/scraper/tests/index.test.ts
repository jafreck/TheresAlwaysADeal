import { describe, it, expect, vi } from "vitest";

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

// Verify all public exports are accessible from the package index
import { BaseScraper, IScraper, gameSchema } from "../src/index.js";
import type { ScrapedGame, ScraperConfig } from "../src/index.js";

describe("index re-exports", () => {
  it("should export BaseScraper", () => {
    expect(BaseScraper).toBeDefined();
  });

  it("should export gameSchema", () => {
    expect(gameSchema).toBeDefined();
  });

  it("should allow instantiation of a BaseScraper subclass via the index export", () => {
    class MyConcreteScraper extends BaseScraper {
      async fetchGames() { return []; }
      normalizeGame(raw: unknown) { return raw as ScrapedGame; }
    }
    const config: ScraperConfig = { retailerDomain: "example.com" };
    const scraper = new MyConcreteScraper(config);
    expect(scraper).toBeInstanceOf(BaseScraper);
    expect(scraper.retailerDomain).toBe("example.com");
  });

  it("should validate a game object with the exported gameSchema", () => {
    const result = gameSchema.safeParse({
      title: "Portal",
      slug: "portal",
      storeUrl: "https://store.steampowered.com/app/400",
      price: 9.99,
      storeSlug: "steam",
    });
    expect(result.success).toBe(true);
  });
});
