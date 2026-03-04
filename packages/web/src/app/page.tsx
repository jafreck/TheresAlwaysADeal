import EmptyState from "@/components/EmptyState";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="flex flex-col items-center justify-center gap-6 px-4 py-20 text-center md:py-32">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 md:text-5xl lg:text-6xl">
          There&apos;s Always a Deal
        </h1>
        <p className="max-w-xl text-lg text-zinc-400 md:text-xl">
          The best deals across the web, automatically aggregated and curated.
        </p>
        <div className="flex gap-3">
          <a
            href="/deals"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-zinc-50 transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Browse Deals
          </a>
          <a
            href="/free-games"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Free Games
          </a>
        </div>
      </section>

      {/* Featured Deals section */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-zinc-50">
          Featured Deals
        </h2>
        <EmptyState
          message="No featured deals yet. Check back soon for the best game deals!"
          icon={<span>🎮</span>}
        />
      </section>
    </div>
  );
}
