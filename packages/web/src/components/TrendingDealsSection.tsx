"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiClient, type EnvelopeResponse } from "@/lib/api-client";
import GameCard from "./GameCard";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";

interface Deal {
  gameTitle: string;
  gameSlug: string;
  headerImageUrl: string;
  price: number;
  originalPrice: number;
  discount: number;
  storeName: string;
  storeLogoUrl?: string | null;
  storeUrl: string;
  dealScore?: number | null;
}

const TABS = [
  { key: "trending", label: "Trending", endpoint: "/deals?limit=12" },
  { key: "new", label: "New Deals", endpoint: "/deals?limit=12" },
  {
    key: "all-time-lows",
    label: "All-Time Lows",
    endpoint: "/deals/all-time-lows?limit=12",
  },
  {
    key: "most-discounted",
    label: "Most Discounted",
    endpoint: "/deals?min_discount=50&limit=12",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface TrendingDealsSectionProps {
  deals: Deal[];
}

export default function TrendingDealsSection({
  deals: initialDeals,
}: TrendingDealsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("trending");

  const tab = TABS.find((t) => t.key === activeTab)!;

  const { data, isLoading } = useQuery({
    queryKey: ["trending-deals", activeTab],
    queryFn: () =>
      apiClient.get<EnvelopeResponse<Deal>>(tab.endpoint).then((r) => r.data),
    initialData: activeTab === "trending" ? initialDeals : undefined,
    enabled: activeTab !== "trending" || initialDeals.length === 0,
  });

  const deals = data ?? initialDeals;

  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Trending Deals</h2>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              activeTab === t.key
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:bg-surface/80",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size={32} />
        </div>
      ) : deals.length === 0 ? (
        <EmptyState message="No deals found for this category." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((deal) => (
            <GameCard
              key={`${deal.gameSlug}-${deal.storeName}`}
              gameTitle={deal.gameTitle}
              gameSlug={deal.gameSlug}
              headerImageUrl={deal.headerImageUrl}
              currentPrice={deal.price}
              originalPrice={deal.originalPrice}
              discount={deal.discount}
              storeName={deal.storeName}
              storeLogoUrl={deal.storeLogoUrl}
              storeUrl={deal.storeUrl}
            />
          ))}
        </div>
      )}
    </section>
  );
}
