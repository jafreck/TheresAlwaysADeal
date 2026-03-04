/* eslint-disable no-undef */
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
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(res.status, res.statusText, errorBody);
  }

  return res.json() as Promise<T>;
}

export interface SearchGamesParams {
  q: string;
  page?: number;
  limit?: number;
  store?: string;
  genre?: string;
  min_discount?: number;
  max_price?: number;
}

export interface AutocompleteParams {
  q: string;
  limit?: number;
}

export interface AutocompleteItem {
  title: string;
  slug: string;
}

export interface AutocompleteResponse {
  data: AutocompleteItem[];
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),

  searchGames: (params: SearchGamesParams) => {
    const qs = buildQuery({ ...params });
    return request<EnvelopeResponse<unknown>>("GET", `/api/v1/games/search?${qs}`);
  },

  autocomplete: (params: AutocompleteParams) => {
    const qs = buildQuery({ ...params });
    return request<AutocompleteResponse>("GET", `/api/v1/games/autocomplete?${qs}`);
  },
};
