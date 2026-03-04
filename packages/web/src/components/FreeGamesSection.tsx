import Image from "next/image";
import Link from "next/link";
import CountdownTimer from "./CountdownTimer";
import EmptyState from "./EmptyState";
import StoreIcon from "./StoreIcon";

export interface FreeGame {
  gameTitle: string;
  gameSlug: string;
  headerImageUrl: string;
  storeName: string;
  storeLogoUrl?: string | null;
  storeUrl: string;
  saleEndsAt?: string | null;
  expiresAt?: string | null;
}

interface FreeGamesSectionProps {
  games: FreeGame[];
}

export default function FreeGamesSection({ games }: FreeGamesSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Free Games</h2>
        <Link
          href="/free-games"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {games.length === 0 ? (
        <EmptyState message="No free games available right now." />
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
          {games.map((game) => {
            const expiryDate = game.saleEndsAt ?? game.expiresAt;
            return (
              <article
                key={`${game.gameSlug}-${game.storeName}`}
                className="group flex min-w-[280px] max-w-[320px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={game.headerImageUrl}
                    alt={game.gameTitle}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute right-2 top-2 rounded-md bg-success px-2 py-0.5 text-sm font-bold text-white">
                    FREE
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 text-base font-semibold leading-tight">
                    {game.gameTitle}
                  </h3>

                  <div className="flex items-center gap-2">
                    <StoreIcon
                      storeName={game.storeName}
                      logoUrl={game.storeLogoUrl}
                      size={20}
                    />
                    <span className="text-sm text-muted">{game.storeName}</span>
                  </div>

                  {expiryDate && (
                    <div className="mt-auto text-xs text-muted">
                      Ends in:{" "}
                      <CountdownTimer expiresAt={expiryDate} />
                    </div>
                  )}

                  <a
                    href={game.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Get ${game.gameTitle} free on ${game.storeName}`}
                    className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Get Free on {game.storeName}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
