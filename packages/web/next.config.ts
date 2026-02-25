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
    ],
  },
};

export default nextConfig;
