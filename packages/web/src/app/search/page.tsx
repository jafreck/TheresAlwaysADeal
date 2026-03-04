/* eslint-disable no-undef */
"use client";

import { Suspense, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { GameCardProps } from "@/components/GameCard";
import { useSearchFilters } from "@/lib/useSearchFilters";
import FiltersPanel from "@/components/FiltersPanel";
import SearchResultsGrid from "@/components/SearchResultsGrid";
import LoadingSpinner from "@/components/LoadingSpinner";

const PAGE_SIZE = 20;

// Map API response items to GameCardProps
function mapResultToCard(item: Record<string, unknown>): GameCardProps {
  return {
    gameTitle: (item.title as string) ?? "",
    gameSlug: (item.slug as string) ?? "",
    headerImageUrl: (item.headerImageUrl as string) ?? (item.header_image_url as string) ?? "/placeholder.png",
    currentPrice: (item.currentPrice as number) ?? (item.current_price as number) ?? 0,
    originalPrice: (item.originalPrice as number) ?? (item.original_price as number) ?? 0,
    discount: (item.discount as number) ?? 0,
    storeName: (item.storeName as string) ?? (item.store_name as string) ?? "",
    storeLogoUrl: (item.storeLogoUrl as string) ?? (item.store_logo_url as string) ?? null,
    storeUrl: (item.storeUrl as string) ?? (item.store_url as string) ?? "#",
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><LoadingSpinner size={32} /></div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const {
    filters,
    setStore,
    setGenre,
    setMinDiscount,
    setMaxPrice,
    setSort,
  } = useSearchFilters();

  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      "searchGames",
      filters.q,
      filters.store,
      filters.genre,
      filters.min_discount,
      filters.max_price,
      filters.sort,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      return apiClient.searchGames({
        q: filters.q || "",
        page: pageParam as number,
        limit: PAGE_SIZE,
        store: filters.store || undefined,
        genre: filters.genre || undefined,
        min_discount: filters.min_discount ?? undefined,
        max_price: filters.max_price ?? undefined,
        sort: filters.sort || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNext) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    enabled: filters.q.length > 0,
  });

  // Infinite scroll via intersection observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Dynamic page title
  useEffect(() => {
    if (filters.q) {
      document.title = `Search Results for "${filters.q}" | There's Always A Deal`;
    } else {
      document.title = "Search | There's Always A Deal";
    }
  }, [filters.q]);

  const allResults: GameCardProps[] =
    data?.pages.flatMap((page) =>
      (page.data as Record<string, unknown>[]).map(mapResultToCard),
    ) ?? [];

  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <FiltersPanel
          values={{
            store: filters.store,
            genre: filters.genre,
            min_discount: filters.min_discount,
            max_price: filters.max_price,
            sort: filters.sort,
          }}
          onStoreChange={setStore}
          onGenreChange={setGenre}
          onMinDiscountChange={setMinDiscount}
          onMaxPriceChange={setMaxPrice}
          onSortChange={setSort}
        />

        <div className="min-w-0 flex-1">
          <SearchResultsGrid
            results={allResults}
            total={total}
            query={filters.q}
            isLoading={isLoading}
            error={error ? error.message : undefined}
            onRetry={() => refetch()}
          />

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <LoadingSpinner size={32} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
