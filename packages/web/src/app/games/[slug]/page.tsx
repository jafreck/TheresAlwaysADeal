import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  apiClient,
  type GameDetail,
  type PriceHistoryEntry,
} from "@/lib/api-client";
import GameBreadcrumb from "@/components/GameBreadcrumb";
import ReadMoreDescription from "@/components/ReadMoreDescription";
import BestPriceCard from "@/components/BestPriceCard";
import PriceComparisonTable, {
  type StoreListingRow,
} from "@/components/PriceComparisonTable";
import PriceHistoryChart, {
  toChartEntries,
} from "@/components/PriceHistoryChart";
import WishlistButton from "@/components/WishlistButton";
import PriceAlertModal from "@/components/PriceAlertModal";
import SimilarGames from "@/components/SimilarGames";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchGame(slug: string): Promise<GameDetail | null> {
  try {
    const response = await apiClient.getGameBySlug(slug);
    return response.data;
  } catch {
    return null;
  }
}

async function fetchPriceHistory(slug: string): Promise<PriceHistoryEntry[]> {
  try {
    const response = await apiClient.getPriceHistory(slug);
    return response.data;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await fetchGame(slug);
  if (!game) {
    return { title: "Game Not Found" };
  }

  return {
    title: game.title,
    description:
      game.description?.slice(0, 160) ??
      `Find the best prices for ${game.title}.`,
    openGraph: {
      title: game.title,
      description:
        game.description?.slice(0, 160) ??
        `Find the best prices for ${game.title}.`,
      images: game.headerImageUrl ? [{ url: game.headerImageUrl }] : [],
      type: "website",
    },
  };
}

function findBestDeal(
  game: GameDetail,
): {
  listing: GameDetail["storeListings"][number];
  stats: GameDetail["priceStats"][number];
} | null {
  let best: {
    listing: GameDetail["storeListings"][number];
    stats: GameDetail["priceStats"][number];
  } | null = null;

  for (const listing of game.storeListings) {
    const stats = game.priceStats.find(
      (s) => s.storeListingId === listing.id,
    );
    if (!stats) continue;
    if (
      !best ||
      Number(stats.currentPrice) < Number(best.stats.currentPrice)
    ) {
      best = { listing, stats };
    }
  }
  return best;
}

function buildTableRows(game: GameDetail): StoreListingRow[] {
  return game.storeListings
    .map((listing) => {
      const stats = game.priceStats.find(
        (s) => s.storeListingId === listing.id,
      );
      if (!stats) return null;
      return {
        storeName: listing.storeName,
        storeUrl: listing.storeUrl,
        currentPrice: Number(stats.currentPrice),
        originalPrice: Number(stats.highestPrice),
        discount:
          Number(stats.highestPrice) > 0
            ? Math.round(
                ((Number(stats.highestPrice) - Number(stats.currentPrice)) /
                  Number(stats.highestPrice)) *
                  100,
              )
            : 0,
        lastChecked: stats.lastCheckedAt,
        isAllTimeLow: listing.isAllTimeLow,
        referralParam: "",
      };
    })
    .filter((row): row is StoreListingRow => row !== null);
}

export default async function GameDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const game = await fetchGame(slug);

  if (!game) {
    notFound();
  }

  const priceHistory = await fetchPriceHistory(slug);
  const bestDeal = findBestDeal(game);
  const tableRows = buildTableRows(game);

  const storeNames: Record<string, string> = {};
  for (const listing of game.storeListings) {
    storeNames[String(listing.id)] = listing.storeName;
  }

  const chartEntries = toChartEntries(priceHistory);

  // Use the first genre for breadcrumb (fallback to "Games")
  const primaryGenre = { name: "Games", slug: "all" };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: game.title,
    description: game.description ?? undefined,
    image: game.headerImageUrl ?? undefined,
    offers: bestDeal
      ? {
          "@type": "Offer",
          price: bestDeal.stats.currentPrice,
          priceCurrency: "USD",
          url: bestDeal.listing.storeUrl,
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <GameBreadcrumb
        gameTitle={game.title}
        genreName={primaryGenre.name}
        genreSlug={primaryGenre.slug}
        className="mb-4"
      />

      {game.headerImageUrl && (
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={game.headerImageUrl}
            alt={game.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            className="object-cover"
          />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{game.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <WishlistButton gameId={game.id} initialIsWishlisted={false} />
              <PriceAlertModal gameId={game.id} gameTitle={game.title} />
            </div>
          </div>

          {game.description && (
            <ReadMoreDescription description={game.description} />
          )}

          {tableRows.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">Price Comparison</h2>
              <PriceComparisonTable rows={tableRows} />
            </section>
          )}

          {chartEntries.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">Price History</h2>
              <PriceHistoryChart
                entries={chartEntries}
                storeNames={storeNames}
              />
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {bestDeal && (
            <BestPriceCard
              storeName={bestDeal.listing.storeName}
              storeUrl={bestDeal.listing.storeUrl}
              currentPrice={Number(bestDeal.stats.currentPrice)}
              originalPrice={Number(bestDeal.stats.highestPrice)}
              discount={
                Number(bestDeal.stats.highestPrice) > 0
                  ? Math.round(
                      ((Number(bestDeal.stats.highestPrice) -
                        Number(bestDeal.stats.currentPrice)) /
                        Number(bestDeal.stats.highestPrice)) *
                        100,
                    )
                  : 0
              }
              isAllTimeLow={bestDeal.listing.isAllTimeLow}
              referralParam=""
            />
          )}

          {/* Ad slot placeholder */}
          <div
            data-slot="game-sidebar"
            className="hidden"
            aria-hidden="true"
          >
            {/* Ad sidebar placeholder */}
          </div>
        </aside>
      </div>

      <SimilarGames
        genreSlugs={[primaryGenre.slug]}
        currentGameId={String(game.id)}
        className="mt-12"
      />
    </div>
  );
}
