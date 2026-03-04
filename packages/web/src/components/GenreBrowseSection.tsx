import Link from "next/link";

const GENRES = [
  { name: "Action", slug: "action" },
  { name: "RPG", slug: "rpg" },
  { name: "Strategy", slug: "strategy" },
  { name: "Adventure", slug: "adventure" },
  { name: "Simulation", slug: "simulation" },
  { name: "Sports", slug: "sports" },
  { name: "Puzzle", slug: "puzzle" },
  { name: "Racing", slug: "racing" },
  { name: "Horror", slug: "horror" },
  { name: "Indie", slug: "indie" },
] as const;

export default function GenreBrowseSection() {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Browse by Genre</h2>

      <div className="flex flex-wrap gap-3">
        {GENRES.map((genre) => (
          <Link
            key={genre.slug}
            href={`/search?genre=${genre.slug}`}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {genre.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
