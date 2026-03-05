"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchHero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <section className="flex flex-col items-center gap-4 px-4 py-16 text-center md:py-24">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 10,000+ games across Steam, GOG, Epic, and more"
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary md:text-lg"
        />
      </form>
      <p className="text-sm text-muted md:text-base">
        Sign up to track prices and get alerts
      </p>
    </section>
  );
}
