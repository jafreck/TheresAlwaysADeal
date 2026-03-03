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
      { protocol: "https", hostname: "**.steamstatic.com" },
      { protocol: "https", hostname: "**.steampowered.com" },
      { protocol: "https", hostname: "**.gog.com" },
      { protocol: "https", hostname: "**.epicgames.com" },
    ],
  },
};

export default nextConfig;
