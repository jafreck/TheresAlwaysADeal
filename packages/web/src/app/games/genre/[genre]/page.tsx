import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { serverApi, type Genre } from "@/lib/server-api";
import type { EnvelopeResponse, GameListItem } from "@/lib/api-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theresalwaysadeal.com";

interface PageProps {
  params: Promise<{ genre: string }>;
  searchParams: Promise<{ page?: string }>;
}

function toTitleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateStaticParams(): Promise<{ genre: string }[]> {
  try {
    const genres = await serverApi.getGenres(3600);
    return genres.map((g) => ({ genre: g.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre } = await params;
  const genreName = toTitleCase(genre);
  const title = `${genreName} Games — Best Deals & Prices`;
  const description = `Compare prices and find the best deals on ${genreName} games across Steam, GOG, Epic Games Store, and more.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/games/genre/${genre}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export const revalidate = 900;

export default async function GenrePage({ params, searchParams }: PageProps) {
  const { genre } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const limit = 24;
  const genreName = toTitleCase(genre);

  let games: GameListItem[] = [];
  let total = 0;
  let hasNext = false;

  try {
    const res = await serverApi.get<EnvelopeResponse<GameListItem>>(
      `/games?genre=${encodeURIComponent(genre)}&page=${page}&limit=${limit}`,
      revalidate,
    );
    games = res.data;
    total = res.meta.total;
    hasNext = res.meta.hasNext;
  } catch {
    // API unavailable — render empty state
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/games" className="hover:text-primary">
              Games
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground font-medium">
            {genreName}
          </li>
        </ol>
      </nav>

      <h1 className="mb-6 text-3xl font-bold">{genreName} Games</h1>

      {games.length === 0 ? (
        <p className="text-muted">No {genreName.toLowerCase()} games found.</p>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-lg"
              >
                {game.headerImageUrl ? (
                  <div className="relative aspect-video w-full">
                    <Image
                      src={game.headerImageUrl}
                      alt={game.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-muted/10">
                    <span className="text-sm text-muted">No image</span>
                  </div>
                )}
                <div className="p-3">
                  <h2 className="text-sm font-semibold leading-tight group-hover:text-primary">
                    {game.title}
                  </h2>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/games/genre/${genre}?page=${page - 1}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted">
                Page {page} of {totalPages}
              </span>
              {hasNext && (
                <Link
                  href={`/games/genre/${genre}?page=${page + 1}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
