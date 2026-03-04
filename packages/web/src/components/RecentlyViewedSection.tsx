"use client";

import { useState, useEffect } from "react";
import GameCard from "./GameCard";

const STORAGE_KEY = "recently-viewed-games";
const MAX_ITEMS = 10;

interface RecentlyViewedGame {
  gameTitle: string;
  gameSlug: string;
  headerImageUrl: string;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  storeName: string;
  storeLogoUrl?: string | null;
  storeUrl: string;
}

export default function RecentlyViewedSection() {
  const [games, setGames] = useState<RecentlyViewedGame[]>([]);

  useEffect(() => {
    try {
 
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedGame[];
        setGames(parsed.slice(0, MAX_ITEMS));
      }
    } catch {
      // localStorage unavailable or corrupt data — show nothing
    }
  }, []);

  if (games.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Recently Viewed</h2>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {games.map((game) => (
          <GameCard
            key={`${game.gameSlug}-${game.storeName}`}
            gameTitle={game.gameTitle}
            gameSlug={game.gameSlug}
            headerImageUrl={game.headerImageUrl}
            currentPrice={game.currentPrice}
            originalPrice={game.originalPrice}
            discount={game.discount}
            storeName={game.storeName}
            storeLogoUrl={game.storeLogoUrl}
            storeUrl={game.storeUrl}
            className="min-w-[280px] max-w-[320px] flex-shrink-0 snap-start"
          />
        ))}
      </div>
    </section>
  );
}
