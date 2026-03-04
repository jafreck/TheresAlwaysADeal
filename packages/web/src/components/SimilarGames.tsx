import { cn } from "@/lib/utils";
import { apiClient, type EnvelopeResponse, type GameListItem } from "@/lib/api-client";
import GameCard from "./GameCard";

export interface SimilarGamesProps {
  genreSlugs: string[];
  currentGameId: string;
  className?: string;
}

const MAX_SIMILAR = 4;

export default async function SimilarGames({
  genreSlugs,
  currentGameId,
  className,
}: SimilarGamesProps) {
  if (genreSlugs.length === 0) {
    return null;
  }

  let games: GameListItem[] = [];
  try {
    const genreParam = genreSlugs.join(",");
    const response = await apiClient.get<EnvelopeResponse<GameListItem>>(
      `/api/v1/games?genre=${encodeURIComponent(genreParam)}&limit=5`,
    );
    games = response.data.filter((g) => String(g.id) !== currentGameId);
  } catch {
    return null;
  }

  if (games.length === 0) {
    return null;
  }

  const displayed = games.slice(0, MAX_SIMILAR);

  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="text-xl font-bold">Similar Games</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayed.map((game) => (
          <GameCard
            key={game.id}
            gameTitle={game.title}
            gameSlug={game.slug}
            headerImageUrl={game.headerImageUrl ?? "/placeholder.png"}
            currentPrice={0}
            originalPrice={0}
            discount={0}
            storeName=""
            storeUrl={`/games/${game.slug}`}
          />
        ))}
      </div>
    </section>
  );
}
