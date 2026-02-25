/**
 * Scraper package entry point.
 *
 * Scrapers are instantiated and dispatched by the worker via BullMQ.
 * Each retailer gets its own scraper class implementing IScraper.
 *
 * Strategy:
 *  - Static HTML retailers  → Cheerio (fast, cheap, no browser overhead)
 *  - JS-rendered retailers  → Playwright (headless Chromium, use sparingly)
 */
export * from "./types.js";
export * from "./schemas.js";
