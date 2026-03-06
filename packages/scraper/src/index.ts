/**
 * Scraper package entry point.
 *
 * Exports base classes, types, schemas, and utilities shared across all scrapers.
 * Concrete scraper implementations live in packages/worker/src/scrapers/.
 */
export { BaseScraper } from "./types.js";
export type { IScraper } from "./types.js";
export type { ScrapedGame, ScraperConfig } from "./types.js";
export { gameSchema } from "./schemas.js";
export { buildReferralUrl } from "./referral.js";
