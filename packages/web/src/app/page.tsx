import { Suspense } from "react";
import type { Metadata } from "next";
import { serverApi } from "@/lib/server-api";
import SearchHero from "@/components/SearchHero";
import AdSlot from "@/components/AdSlot";
import FeaturedDealsSection, {
  type FeaturedDeal,
} from "@/components/FeaturedDealsSection";
import FreeGamesSection, {
  type FreeGame,
} from "@/components/FreeGamesSection";
import TrendingDealsSection from "@/components/TrendingDealsSection";
import GenreBrowseSection from "@/components/GenreBrowseSection";
import RecentlyViewedSection from "@/components/RecentlyViewedSection";
import type { EnvelopeResponse } from "@/lib/api-client";

export const revalidate = 900;

export const metadata: Metadata = {
  title:
    "There\u2019s Always a Deal \u2014 Best Game Deals Across Steam, GOG, Epic & More",
  description:
    "Compare game deals and prices across Steam, GOG, Epic Games Store, and more. Find the best price comparison for PC game deals, free games, and all-time low prices.",
  openGraph: {
    title:
      "There\u2019s Always a Deal \u2014 Best Game Deals Across Steam, GOG, Epic & More",
    description:
      "Compare game deals and prices across Steam, GOG, Epic Games Store, and more. Find the best price comparison for PC game deals, free games, and all-time low prices.",
    images: [{ url: "/og-home.png", width: 1200, height: 630 }],
  },
};

async function fetchDeals<T>(path: string): Promise<T[]> {
  try {
    const res = await serverApi.get<EnvelopeResponse<T>>(path, revalidate);
    return res.data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featuredDeals, freeGames, trendingDeals] = await Promise.all([
    fetchDeals<FeaturedDeal>("/deals?limit=10"),
    fetchDeals<FreeGame>("/deals/free?limit=10"),
    fetchDeals<FeaturedDeal>("/deals?limit=12"),
  ]);

  return (
    <div className="flex flex-col gap-12">
      <SearchHero />

      <AdSlot slotId="above-fold" />

      <div className="mx-auto w-full max-w-7xl px-4">
        <FeaturedDealsSection deals={featuredDeals} />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4">
        <FreeGamesSection games={freeGames} />
      </div>

      <AdSlot slotId="mid-page" />

      <Suspense>
        <div className="mx-auto w-full max-w-7xl px-4">
          <TrendingDealsSection deals={trendingDeals} />
        </div>
      </Suspense>

      <div className="mx-auto w-full max-w-7xl px-4">
        <GenreBrowseSection />
      </div>

      <Suspense>
        <div className="mx-auto w-full max-w-7xl px-4 pb-12">
          <RecentlyViewedSection />
        </div>
      </Suspense>
    </div>
  );
}
