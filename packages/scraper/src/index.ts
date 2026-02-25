/**
 * Scraper package entry point.
 *
 * Scrapers are instantiated and dispatched by the worker via BullMQ.
 * Each retailer gets its own scraper class extending BaseScraper.
 *
 * Strategy:
 *  - Static HTML retailers  → Cheerio (fast, cheap, no browser overhead)
 *  - JS-rendered retailers  → Playwright (headless Chromium, use sparingly)
 */
export { BaseScraper, IScraper } from "./types.js";
export type { ScrapedGame, ScraperConfig } from "./types.js";
export { gameSchema } from "./schemas.js";
export { buildReferralUrl } from "./referral.js";
export { SteamScraper } from "./steam.js";
