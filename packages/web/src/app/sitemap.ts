import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://theresalwaysadeal.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // TODO: Fetch dynamic game slug URLs from the API when available
  // const games = await apiClient.getGames();
  // const gameRoutes = games.map((game) => ({
  //   url: `${SITE_URL}/games/${game.slug}`,
  //   lastModified: game.updatedAt,
  //   changeFrequency: "daily" as const,
  //   priority: 0.8,
  // }));

  return [...staticRoutes];
}
