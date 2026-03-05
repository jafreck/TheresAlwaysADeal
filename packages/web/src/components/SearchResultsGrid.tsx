"use client";

import GameCard from "./GameCard";
import type { GameCardProps } from "./GameCard";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

export interface SearchResultsGridProps {
  results: GameCardProps[];
  total: number;
  query: string;
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
}

export default function SearchResultsGrid({
  results,
  total,
  query,
  isLoading,
  error,
  onRetry,
}: SearchResultsGridProps) {
  if (isLoading && results.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!isLoading && results.length === 0) {
    return (
      <EmptyState
        message={
          query
            ? `No results found for "${query}". Try searching for "action" or browse deals.`
            : "Try searching for a game to get started."
        }
      />
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        {total.toLocaleString()} result{total !== 1 ? "s" : ""}{" "}
        {query ? (
          <>
            for &ldquo;<span className="font-medium text-zinc-200">{query}</span>
            &rdquo;
          </>
        ) : null}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((game, index) => (
          <GameCard
            key={`${game.gameSlug}-${game.storeName}-${index}`}
            {...game}
          />
        ))}
      </div>
    </div>
  );
}
