import { BaseScraper, type ScrapedGame } from "@taad/scraper";

const FREE_GAMES_URL =
  "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US";
const GRAPHQL_URL = "https://graphql.epicgames.com/graphql";
const PAGE_SIZE = 40;

interface EpicTotalPrice {
  discountPrice: number;
  originalPrice: number;
  discount: number;
  currencyCode: string;
}

interface EpicPromoOffer {
  startDate: string;
  endDate: string;
}

interface EpicPromotions {
  promotionalOffers: Array<{ promotionalOffers: EpicPromoOffer[] }>;
}

interface EpicElement {
  id: string;
  title: string;
  productSlug: string | null;
  urlSlug: string | null;
  price: { totalPrice: EpicTotalPrice } | null;
  promotions: EpicPromotions | null;
}

export interface EpicRawItem extends EpicElement {
  _isFree: boolean;
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default class EpicScraper extends BaseScraper {
  constructor(cfg: { retailerDomain: string }) {
    super({ ...cfg, rateLimitRps: 2 });
  }

  async fetchGames(): Promise<EpicRawItem[]> {
    // 1. Fetch currently-free games from REST endpoint
    const freeRes = await this.fetchWithRetry(() => fetch(FREE_GAMES_URL));
    const freeJson = (await freeRes.json()) as {
      data: { Catalog: { searchStore: { elements: EpicElement[] } } };
    };
    const freeItems: EpicRawItem[] = (
      freeJson.data?.Catalog?.searchStore?.elements ?? []
    ).map((el) => ({ ...el, _isFree: true }));

    // 2. Fetch on-sale games from GraphQL catalog with offset-based pagination
    const catalogItems: EpicRawItem[] = [];
    let start = 0;
    let total = Infinity;

    const gqlQuery = `query searchStore($count: Int, $start: Int, $country: String, $locale: String) {
      Catalog {
        searchStore(count: $count, start: $start, country: $country, locale: $locale, onSale: true, sortBy: "currentPrice", sortDir: "ASC") {
          elements {
            id title productSlug urlSlug
            price(country: $country) {
              totalPrice { discountPrice originalPrice discount currencyCode }
            }
            promotions {
              promotionalOffers {
                promotionalOffers { startDate endDate }
              }
            }
          }
          paging { count total }
        }
      }
    }`;

    while (start < total) {
      const res = await this.fetchWithRetry(() =>
        fetch(GRAPHQL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: gqlQuery,
            variables: { count: PAGE_SIZE, start, country: "US", locale: "en-US" },
          }),
        }),
      );

      const json = (await res.json()) as {
        data: {
          Catalog: {
            searchStore: {
              elements: EpicElement[];
              paging: { count: number; total: number };
            };
          };
        };
      };

      const searchStore = json.data?.Catalog?.searchStore;
      if (!searchStore) break;

      total = searchStore.paging?.total ?? 0;
      const elements: EpicRawItem[] = (searchStore.elements ?? []).map((el) => ({
        ...el,
        _isFree: false,
      }));
      catalogItems.push(...elements);
      start += elements.length;
      if (elements.length === 0) break;
    }

    return [...freeItems, ...catalogItems];
  }

  normalizeGame(raw: unknown): ScrapedGame {
    const item = raw as EpicRawItem;
    const totalPrice = item.price?.totalPrice;
    const discountPriceCents = totalPrice?.discountPrice ?? 0;
    const originalPriceCents = totalPrice?.originalPrice ?? 0;

    const price = item._isFree ? 0 : discountPriceCents / 100;
    const originalPrice = originalPriceCents / 100;
    const discountPercent =
      originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;

    // Extract sale end date from active promotional offers
    const promoOffers = item.promotions?.promotionalOffers?.[0]?.promotionalOffers ?? [];
    const saleEndsAt = promoOffers[0]?.endDate ?? null;

    const pageSlug = item.productSlug ?? item.urlSlug ?? item.id;
    const storeUrl = `https://store.epicgames.com/en-US/p/${pageSlug}`;

    return {
      title: item.title,
      slug: toSlug(item.title),
      storeUrl,
      price,
      originalPrice: originalPrice > 0 && originalPrice !== price ? originalPrice : undefined,
      discountPercent,
      currency: totalPrice?.currencyCode ?? "USD",
      storeSlug: "epic-games",
      storeGameId: item.id,
      saleEndsAt,
    };
  }
}
