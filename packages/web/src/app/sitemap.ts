import type { MetadataRoute } from "next";
import { apiClient, type EnvelopeResponse, type GameListItem } from "@/lib/api-client";

export const revalidate = 3600;

const BASE_URL = "https://theresalwaysadeal.com";

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
  { url: `${BASE_URL}/deals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/free-games`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/stores`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  { url: `${BASE_URL}/affiliate-disclosure`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [...staticPages];

  try {
    let page = 1;
    let hasNext = true;
    while (hasNext) {
      const response = await apiClient.get<EnvelopeResponse<GameListItem>>(
        `/api/v1/games?limit=1000&page=${page}`,
      );
      for (const game of response.data) {
        entries.push({
          url: `${BASE_URL}/games/${game.slug}`,
          lastModified: new Date(game.updatedAt),
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
      hasNext = response.meta.hasNext;
      page++;
    }
  } catch {
    // If API is unavailable, return only the static page entries
  }

  return entries;
}
