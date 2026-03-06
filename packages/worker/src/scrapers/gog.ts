import { BaseScraper, type ScrapedGame, type ScraperConfig } from "@taad/scraper";

const CATALOG_URL = "https://catalog.gog.com/v1/catalog";

interface GogMoneyAmount {
  amount: string;
  currency: string;
}

interface GogCatalogPrice {
  final: string;
  base: string;
  discount: string;
  finalMoney?: GogMoneyAmount;
  baseMoney?: GogMoneyAmount;
}

interface GogCatalogProduct {
  id: string;
  title: string;
  slug: string;
  price?: GogCatalogPrice;
  coverHorizontal?: string;
  coverVertical?: string;
}

interface GogCatalogResponse {
  pages: number;
  products: GogCatalogProduct[];
}

export default class GOGScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super({ rateLimitRps: 2, ...config, retailerDomain: "gog" });
  }

  async fetchGames(): Promise<unknown[]> {
    const allProducts: GogCatalogProduct[] = [];
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
      allProducts.push(...products);

      page++;
    } while (page <= totalPages);

    return allProducts;
  }

  normalizeGame(raw: unknown): ScrapedGame {
    const product = raw as GogCatalogProduct;

    if (!product.price) {
      throw new Error(`No price data for GOG product ${product.id}`);
    }

    // Catalog API returns prices as dollar strings like "$4.79" or via finalMoney/baseMoney
    const finalPrice = product.price.finalMoney
      ? parseFloat(product.price.finalMoney.amount)
      : parseFloat(product.price.final.replace(/[^0-9.]/g, ""));
    const basePrice = product.price.baseMoney
      ? parseFloat(product.price.baseMoney.amount)
      : parseFloat(product.price.base.replace(/[^0-9.]/g, ""));

    // Discount is a string like "-60%" or "0%"
    const discountPercent = Math.abs(parseInt(product.price.discount, 10)) || 0;

    const title = product.title;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const storeUrl = `https://www.gog.com/game/${product.slug}`;

    const headerImageUrl = product.coverHorizontal ?? product.coverVertical ?? undefined;

    return {
      title,
      slug,
      storeUrl,
      price: finalPrice,
      originalPrice: basePrice,
      discountPercent,
      currency: product.price.finalMoney?.currency ?? "USD",
      storeSlug: "gog",
      storeGameId: String(product.id),
      headerImageUrl,
    };
  }
}
