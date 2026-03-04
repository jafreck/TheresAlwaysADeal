import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for highlighting potential issues
  reactStrictMode: true,
  // Allow images from external deal/retailer domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazon.com" },
      { protocol: "https", hostname: "**.bestbuy.com" },
      { protocol: "https", hostname: "**.walmart.com" },
      { protocol: "https", hostname: "steamcdn-a.akamaihd.net" },
      { protocol: "https", hostname: "cdn.akamai.steamstatic.com" },
      { protocol: "https", hostname: "images.gog-statics.com" },
      { protocol: "https", hostname: "cdn1.epicgames.com" },
    ],
  },
};

export default nextConfig;
