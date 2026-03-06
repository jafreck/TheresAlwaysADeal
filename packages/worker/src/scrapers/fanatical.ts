import { BaseScraper, type ScrapedGame, buildReferralUrl } from "@taad/scraper";

interface FanaticalAlgoliaHit {
  name: string;
  slug: string;
  type?: string;
  price?: { USD?: number };
  fullPrice?: { USD?: number };
  discount?: number;
  steam_link?: string;
  end_time?: number;
  cover?: string;
  image?: string;
}

interface FanaticalAlgoliaResponse {
  hits: FanaticalAlgoliaHit[];
  page: number;
  nbPages: number;
}

const ALGOLIA_INDEX = "fan_alt_en_US_public";
const FANATICAL_BASE_URL = "https://www.fanatical.com/en";

export class FanaticalScraper extends BaseScraper {
  private readonly appId: string;
  private readonly searchKey: string;

  constructor() {
    const appId = process.env.FANATICAL_ALGOLIA_APP_ID;
    const searchKey = process.env.FANATICAL_ALGOLIA_SEARCH_KEY;

    if (!appId || !searchKey) {
      throw new Error("FANATICAL_ALGOLIA_APP_ID and FANATICAL_ALGOLIA_SEARCH_KEY must be set");
    }

    super({ retailerDomain: "fanatical.com", rateLimitRps: 5 });

    this.appId = appId;
    this.searchKey = searchKey;
  }

  private async queryAlgolia(filters: string): Promise<FanaticalAlgoliaHit[]> {
    const url = `https://${this.appId}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
    const headers = {
      "Content-Type": "application/json",
      "X-Algolia-Application-Id": this.appId,
      "X-Algolia-API-Key": this.searchKey,
    };

    const hits: FanaticalAlgoliaHit[] = [];
    let page = 0;
    let nbPages = 1;

    while (page < nbPages) {
      const res = await this.fetchWithRetry(() =>
        fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ filters, hitsPerPage: 200, page }),
        })
      );
      if (!res.ok) {
        throw new Error(`Algolia request failed: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as FanaticalAlgoliaResponse;
      hits.push(...data.hits);
      nbPages = data.nbPages;
      page++;
    }

    return hits;
  }

  async fetchGames(): Promise<FanaticalAlgoliaHit[]> {
    const [onSaleHits, bundleHits] = await Promise.all([
      this.queryAlgolia("on_sale=1"),
      this.queryAlgolia("type:bundle"),
    ]);

    const seen = new Set<string>();
    const combined: FanaticalAlgoliaHit[] = [];
    for (const hit of [...onSaleHits, ...bundleHits]) {
      if (!seen.has(hit.slug)) {
        seen.add(hit.slug);
        combined.push(hit);
      }
    }
    return combined;
  }

  normalizeGame(raw: unknown): ScrapedGame {
    const hit = raw as FanaticalAlgoliaHit;
    const isBundle = hit.type === "bundle";
    const path = isBundle ? `bundle/${hit.slug}` : `game/${hit.slug}`;
    const storeUrl = buildReferralUrl(`${FANATICAL_BASE_URL}/${path}`, "fanatical");

    let steamAppId: number | undefined;
    if (hit.steam_link) {
      const match = /\/app\/(\d+)/.exec(hit.steam_link);
      if (match?.[1]) {
        steamAppId = parseInt(match[1], 10);
      }
    }

    return {
      title: hit.name,
      slug: hit.slug,
      storeUrl,
      price: hit.price?.USD ?? 0,
      originalPrice: hit.fullPrice?.USD,
      discountPercent: hit.discount,
      currency: "USD",
      storeSlug: "fanatical",
      storeGameId: hit.slug,
      steamAppId,
      headerImageUrl: hit.cover ?? hit.image ?? undefined,
      saleEndsAt: hit.end_time ? new Date(hit.end_time * 1000).toISOString() : undefined,
    };
  }
}

export default FanaticalScraper;
