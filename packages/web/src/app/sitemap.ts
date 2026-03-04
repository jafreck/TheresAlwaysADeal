import type { MetadataRoute } from "next";
import { apiClient, type EnvelopeResponse, type GameListItem } from "@/lib/api-client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: "https://theresalwaysadeal.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  try {
    const response = await apiClient.get<EnvelopeResponse<GameListItem>>(
      "/api/v1/games?limit=1000",
    );
    for (const game of response.data) {
      entries.push({
        url: `https://theresalwaysadeal.com/games/${game.slug}`,
        lastModified: new Date(game.updatedAt),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  } catch {
    // If API is unavailable, return only the homepage entry
  }

  return entries;
}
