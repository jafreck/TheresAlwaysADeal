import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import {
  apiClient,
  ApiError,
  type GameDetail,
  type PriceHistoryEntry,
} from "@/lib/api-client";
import GameBreadcrumb from "@/components/GameBreadcrumb";
import ReadMoreDescription from "@/components/ReadMoreDescription";
import BestPriceCard from "@/components/BestPriceCard";
import PriceComparisonTable, {
  type StoreListingRow,
} from "@/components/PriceComparisonTable";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import { toChartEntries } from "@/lib/price-history";
import WishlistButton from "@/components/WishlistButton";
import PriceAlertModal from "@/components/PriceAlertModal";
import SimilarGames from "@/components/SimilarGames";
import AdSlot from "@/components/AdSlot";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchGame(slug: string): Promise<GameDetail | null> {
  try {
    const response = await apiClient.getGameBySlug(slug);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 301) {
      const body = error.body as { redirect?: boolean; newSlug?: string } | null;
      if (body?.redirect && body.newSlug) {
        redirect(`/games/${body.newSlug}`);
      }
    }
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

  const description = game.description
    ? generateMetaDescription(game.description)
    : `Compare prices and find the best deals for ${game.title} across multiple stores.`;

  return {
    title: game.title,
    description,
    alternates: {
      canonical: `https://theresalwaysadeal.com/games/${slug}`,
    },
    openGraph: {
      title: game.title,
      description,
      images: game.headerImageUrl ? [{ url: game.headerImageUrl }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image" as const,
      title: game.title,
      description,
      images: game.headerImageUrl ? [game.headerImageUrl] : [],
    },
  };
}

function generateMetaDescription(description: string): string {
  // Find the first complete sentence within 160 chars
  const sentenceEnd = description.search(/[.!?]\s/);
  if (sentenceEnd !== -1 && sentenceEnd < 155) {
    return description.slice(0, sentenceEnd + 1);
  }
  // Fall back to truncating at a word boundary
  if (description.length <= 160) return description;
  const truncated = description.slice(0, 157);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 100 ? truncated.slice(0, lastSpace) + "..." : truncated + "...";
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

  const allOffers = game.storeListings
    .filter((listing) => listing.isActive)
    .map((listing) => {
      const stats = game.priceStats.find(
        (s) => s.storeListingId === listing.id,
      );
      if (!stats) return null;
      return {
        "@type": "Offer" as const,
        price: stats.currentPrice,
        priceCurrency: "USD",
        url: listing.storeUrl,
        availability: "https://schema.org/InStock",
      };
    })
    .filter((o): o is NonNullable<typeof o> => o !== null);

  const prices = allOffers.map((o) => Number(o.price));
  const offersJsonLd =
    allOffers.length > 1
      ? {
          "@type": "AggregateOffer" as const,
          lowPrice: String(Math.min(...prices)),
          highPrice: String(Math.max(...prices)),
          priceCurrency: "USD",
          offerCount: allOffers.length,
          offers: allOffers,
        }
      : allOffers[0] ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: game.title,
    description: game.description ?? undefined,
    image: game.headerImageUrl ?? undefined,
    offers: offersJsonLd,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <GameBreadcrumb
        gameTitle={game.title}
        gameSlug={slug}
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

          <AdSlot slotId="game-detail-sidebar" />
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
