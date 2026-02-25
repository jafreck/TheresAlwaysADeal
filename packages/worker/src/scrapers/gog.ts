import { BaseScraper, type ScrapedGame, type ScraperConfig } from "@taad/scraper";

const CATALOG_URL = "https://catalog.gog.com/v1/catalog";
const PRODUCTS_URL = "https://api.gog.com/products";

interface GogCatalogProduct {
  id: string;
  title: string;
  slug: string;
}

interface GogCatalogResponse {
  pages: number;
  products: GogCatalogProduct[];
}

interface GogPriceItem {
  /** Price in cents as a string, e.g. "999" = $9.99 */
  basePrice: string;
  finalPrice: string;
  discount: string;
}

interface GogProductDetails {
  id: number;
  title: string;
  slug: string;
  _embedded?: {
    prices?: {
      items?: GogPriceItem[];
    };
  };
}

interface GogRawItem {
  catalog: GogCatalogProduct;
  details: GogProductDetails;
}

export default class GOGScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super({ rateLimitRps: 2, ...config, retailerDomain: "gog" });
  }

  async fetchGames(): Promise<unknown[]> {
    const allProducts: GogRawItem[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const url = new URL(CATALOG_URL);
      url.searchParams.set("discounted", "true");
      url.searchParams.set("productType", "in:game");
      url.searchParams.set("limit", "48");
      url.searchParams.set("page", String(page));

      const res = await this.fetchWithRetry(() =>
        fetch(url.toString(), { headers: this.headers }),
      );
      const data = (await res.json()) as GogCatalogResponse;
      totalPages = data.pages ?? 1;

      const products = data.products ?? [];

      // Fetch pricing details for each product on this page
      const pageItems = await Promise.all(
        products.map(async (product): Promise<GogRawItem | null> => {
          try {
            const priceRes = await this.fetchWithRetry(() =>
              fetch(`${PRODUCTS_URL}/${product.id}?expand=prices&currency=USD`, {
                headers: this.headers,
              }),
            );
            const details = (await priceRes.json()) as GogProductDetails;
            return { catalog: product, details };
          } catch {
            return null;
          }
        }),
      );

      for (const item of pageItems) {
        if (item !== null) allProducts.push(item);
      }

      page++;
    } while (page <= totalPages);

    return allProducts;
  }

  normalizeGame(raw: unknown): ScrapedGame {
    const { catalog, details } = raw as GogRawItem;

    const priceItem = details._embedded?.prices?.items?.[0];
    if (!priceItem) {
      throw new Error(`No price data for GOG product ${catalog.id}`);
    }

    // GOG prices are in cents as integer strings, e.g. "999" = $9.99
    const finalPriceCents = parseInt(priceItem.finalPrice, 10);
    const basePriceCents = parseInt(priceItem.basePrice, 10);
    const discountPercent = parseFloat(priceItem.discount);

    const price = finalPriceCents / 100;
    const originalPrice = basePriceCents / 100;

    const title = catalog.title || details.title;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const gameSlug = catalog.slug || details.slug;
    const storeUrl = `https://www.gog.com/game/${gameSlug}`;

    return {
      title,
      slug,
      storeUrl,
      price,
      originalPrice,
      discountPercent,
      currency: "USD",
      storeSlug: "gog",
      storeGameId: String(catalog.id),
    };
  }
}
