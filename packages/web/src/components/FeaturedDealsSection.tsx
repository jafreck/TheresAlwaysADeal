import Link from "next/link";
import GameCard from "./GameCard";
import EmptyState from "./EmptyState";
import type { Deal } from "@/lib/types";

export type { Deal as FeaturedDeal } from "@/lib/types";

interface FeaturedDealsSectionProps {
  deals: Deal[];
}

export default function FeaturedDealsSection({
  deals,
}: FeaturedDealsSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Featured Deals</h2>
        <Link
          href="/deals"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all deals
        </Link>
      </div>

      {deals.length === 0 ? (
        <EmptyState message="No featured deals right now. Check back soon!" />
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
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
              className="min-w-[280px] max-w-[320px] flex-shrink-0 snap-start"
            />
          ))}
        </div>
      )}
    </section>
  );
}
