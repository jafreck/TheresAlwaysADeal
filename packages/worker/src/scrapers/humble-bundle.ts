import { BaseScraper, type ScrapedGame, type ScraperConfig } from "@taad/scraper";

const BASE_URL = "https://www.humblebundle.com";

interface RawSaleItem {
  _type: "sale";
  machine_name: string;
  human_name: string;
  current_price: { amount: number; currency?: string };
  full_price: { amount: number };
  discount_percent: number;
  human_url: string;
  choice_eligible?: boolean;
}

interface RawBundleItem {
  _type: "bundle";
  machine_name: string;
  tile_name: string;
  mosaic_url: string;
  pricing: {
    minimum: { amount: number };
  };
}

type RawItem = RawSaleItem | RawBundleItem;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function absoluteUrl(url: string): string {
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

export class HumbleScraper extends BaseScraper {
  constructor() {
    const config: ScraperConfig = {
      retailerDomain: "humble-bundle",
      headers: { Accept: "application/json" },
      rateLimitRps: 2,
    };
    super(config);
  }

  async fetchGames(): Promise<unknown[]> {
    const [saleRes, mosaicRes] = await Promise.all([
      this.fetchWithRetry(() =>
        fetch(`${BASE_URL}/store/api/search?sort=discount&filter=onsale`, {
          headers: this.headers,
        }),
      ),
      this.fetchWithRetry(() =>
        fetch(`${BASE_URL}/api/v1/mosaic?sort=countdown`, {
          headers: this.headers,
        }),
      ),
    ]);

    const saleData = (await saleRes.json()) as { results?: Record<string, unknown>[] };
    const mosaicData = (await mosaicRes.json()) as { data?: Record<string, unknown>[] };

    const saleItems: RawSaleItem[] = (saleData.results ?? []).map((item) => ({
      _type: "sale",
      ...(item as Omit<RawSaleItem, "_type">),
    }));

    const bundleItems: RawBundleItem[] = (mosaicData.data ?? []).map((item) => ({
      _type: "bundle",
      ...(item as Omit<RawBundleItem, "_type">),
    }));

    return [...saleItems, ...bundleItems];
  }

  normalizeGame(raw: unknown): ScrapedGame {
    const item = raw as RawItem;

    if (item._type === "bundle") {
      return {
        title: item.tile_name,
        slug: toSlug(item.machine_name),
        storeUrl: absoluteUrl(item.mosaic_url),
        price: item.pricing?.minimum?.amount ?? 0,
        currency: "USD",
        storeSlug: "humble-bundle",
        storeGameId: item.machine_name,
      };
    }

    // Individual sale item
    return {
      title: item.human_name,
      slug: toSlug(item.machine_name),
      storeUrl: absoluteUrl(item.human_url),
      price: item.current_price?.amount ?? 0,
      originalPrice: item.full_price?.amount,
      discountPercent: item.discount_percent,
      currency: item.current_price?.currency ?? "USD",
      storeSlug: "humble-bundle",
      storeGameId: item.machine_name,
      choiceIncluded: item.choice_eligible === true ? true : undefined,
    };
  }
}

export default HumbleScraper;
