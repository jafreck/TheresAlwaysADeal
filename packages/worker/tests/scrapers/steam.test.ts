import { describe, it, expect, vi } from "vitest";

const mockSteamScraperClass = vi.fn();

vi.mock("@taad/scraper", () => ({
  SteamScraper: mockSteamScraperClass,
  BaseScraper: class {},
}));

describe("scrapers/steam", () => {
  it("should default-export SteamScraper from @taad/scraper", async () => {
    const mod = await import("../../src/scrapers/steam.js");
    expect(mod.default).toBe(mockSteamScraperClass);
  });
});
