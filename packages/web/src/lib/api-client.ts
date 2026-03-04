import { useAuthStore } from "./auth-store";

export interface EnvelopeMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export interface EnvelopeResponse<T> {
  data: T[];
  meta: EnvelopeMeta;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(`API error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = useAuthStore.getState().accessToken;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: getHeaders(),
    credentials: "include",
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(res.status, res.statusText, errorBody);
  }

  return res.json() as Promise<T>;
}

export interface StoreListing {
  id: number;
  storeId: number;
  storeName: string;
  storeSlug: string;
  storeUrl: string;
  isActive: boolean;
  isAllTimeLow: boolean;
}

export interface PriceStats {
  id: number;
  storeListingId: number;
  currentPrice: string;
  lowestPrice: string;
  highestPrice: string;
  averagePrice: string;
  lastCheckedAt: string;
}

export interface GameListItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  headerImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  headerImageUrl: string | null;
  steamAppId: string | null;
  createdAt: string;
  updatedAt: string;
  storeListings: StoreListing[];
  priceStats: PriceStats[];
}

export interface PriceHistoryEntry {
  id: number;
  storeListingId: number;
  price: string;
  originalPrice: string;
  currency: string;
  discount: number;
  saleEndsAt: string | null;
  recordedAt: string;
}

export interface WishlistResponse {
  id: number;
  gameId: number;
  userId: number;
  createdAt: string;
}

export interface PriceAlertResponse {
  id: number;
  gameId: number;
  userId: number;
  targetPrice: string;
  isActive: boolean;
  createdAt: string;
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),

  getGameBySlug: (slug: string) =>
    request<{ data: GameDetail }>("GET", `/api/v1/games/${slug}`),

  getPriceHistory: (slug: string, store?: string) => {
    const params = store ? `?store=${encodeURIComponent(store)}` : "";
    return request<{ data: PriceHistoryEntry[] }>(
      "GET",
      `/api/v1/games/${slug}/price-history${params}`,
    );
  },

  toggleWishlist: (gameId: number) =>
    request<{ data: WishlistResponse }>("POST", `/api/v1/wishlists`, { gameId }),

  createPriceAlert: (gameId: number, targetPrice: number) =>
    request<{ data: PriceAlertResponse }>("POST", `/api/v1/price-alerts`, {
      gameId,
      targetPrice,
    }),
};
