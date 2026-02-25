import type { z } from "zod";
import type { dealSchema } from "./schemas.js";

export type ScrapedDeal = z.infer<typeof dealSchema>;

/**
 * Base interface all retailer scrapers must implement.
 * Use Cheerio for static HTML pages; fall back to Playwright for JS-heavy pages.
 */
export interface IScraper {
  readonly retailerDomain: string;
  scrape(): Promise<ScrapedDeal[]>;
}
