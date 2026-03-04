import type { MetadataRoute } from "next";

// TODO: Populate with game page URLs when the game data API is available
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://theresalwaysadeal.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
