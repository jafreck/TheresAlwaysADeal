import { BaseScraper, type ScrapedGame, type ScraperConfig } from "./types.js";

const STEAM_BASE = "https://store.steampowered.com/api";

interface SteamPriceOverview {
  currency: string;
  initial: number;
  final: number;
  discount_percent: number;
}

interface SteamGenre {
  id: string;
  description: string;
}

interface SteamAppDetail {
  success: boolean;
  data?: {
    steam_appid: number;
    name: string;
    short_description?: string;
    header_image?: string;
    genres?: SteamGenre[];
    price_overview?: SteamPriceOverview;
    is_free?: boolean;
  };
}

interface SteamFeaturedItem {
  id: number;
}

interface SteamFeaturedResponse {
  featured_win?: SteamFeaturedItem[];
  featured_mac?: SteamFeaturedItem[];
  featured_linux?: SteamFeaturedItem[];
}

interface SteamFeaturedCategoriesResponse {
  specials?: { items?: SteamFeaturedItem[] };
  top_sellers?: { items?: SteamFeaturedItem[] };
}

/** ~200 requests per 5 minutes = ~40 RPM */
const STEAM_RATE_LIMIT_RPM = 40;

/** Simple slug generator: lowercase, replace non-alphanumeric with hyphens, trim. */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class SteamScraper extends BaseScraper {
  constructor(config?: Partial<ScraperConfig>) {
    super({
      retailerDomain: "store.steampowered.com",
      rateLimitRpm: STEAM_RATE_LIMIT_RPM,
      maxRetries: 3,
      ...config,
    });
  }

  /** Collect on-sale app IDs from featuredcategories and featured endpoints. */
  private async collectOnSaleAppIds(): Promise<Set<number>> {
    const appIds = new Set<number>();

    // Featured categories (specials)
    try {
      const catRes = await this.fetchWithRetry(() =>
        fetch(`${STEAM_BASE}/featuredcategories?cc=us&l=en`)
      );
      if (catRes.ok) {
        const catData = (await catRes.json()) as SteamFeaturedCategoriesResponse;
        for (const item of catData.specials?.items ?? []) {
          appIds.add(item.id);
        }
        for (const item of catData.top_sellers?.items ?? []) {
          appIds.add(item.id);
        }
      }
    } catch {
      // non-fatal — continue to featured endpoint
    }

    // Featured (global deals)
    try {
      const featRes = await this.fetchWithRetry(() =>
        fetch(`${STEAM_BASE}/featured?cc=us&l=en`)
      );
      if (featRes.ok) {
        const featData = (await featRes.json()) as SteamFeaturedResponse;
        for (const item of [
          ...(featData.featured_win ?? []),
          ...(featData.featured_mac ?? []),
          ...(featData.featured_linux ?? []),
        ]) {
          appIds.add(item.id);
        }
      }
    } catch {
      // non-fatal
    }

    return appIds;
  }

  /**
   * Fetches on-sale games from Steam. Returns an array of raw Steam app detail
   * objects (one per on-sale app with a price_overview).
   */
  async fetchGames(): Promise<unknown[]> {
    const appIds = await this.collectOnSaleAppIds();
    const results: unknown[] = [];

    for (const appId of appIds) {
      try {
        const res = await this.fetchWithRetry(() =>
          fetch(`${STEAM_BASE}/appdetails?appids=${appId}&cc=us&l=en`)
        );
        if (!res.ok) continue;

        const json = (await res.json()) as Record<string, SteamAppDetail>;
        const detail = json[String(appId)];
        if (!detail?.success || !detail.data) continue;

        // Skip free-to-play and games without price information
        if (detail.data.is_free || !detail.data.price_overview) continue;

        results.push(detail.data);
      } catch {
        // skip individual app failures
      }
    }

    return results;
  }

  /** Maps a raw Steam app detail object to a canonical ScrapedGame. */
  normalizeGame(raw: unknown): ScrapedGame {
    const data = raw as NonNullable<SteamAppDetail["data"]>;

    if (!data.price_overview) {
      throw new Error(`Steam app ${data.steam_appid} has no price_overview`);
    }

    const { initial, final, discount_percent, currency } = data.price_overview;

    // Steam prices are in cents
    const price = final / 100;
    const originalPrice = initial / 100;

    const appId = data.steam_appid;
    const title = data.name;
    const slug = toSlug(title);
    const storeUrl = `https://store.steampowered.com/app/${appId}`;

    return {
      title,
      slug,
      storeUrl,
      price,
      originalPrice,
      discountPercent: discount_percent,
      currency: currency ?? "USD",
      storeSlug: "steam",
      storeGameId: String(appId),
      steamAppId: appId,
      description: data.short_description,
      headerImageUrl: data.header_image,
      genres: data.genres?.map((g) => g.description),
    };
  }
}

export default SteamScraper;
