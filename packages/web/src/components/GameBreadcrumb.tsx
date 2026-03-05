import Link from "next/link";
import { cn } from "@/lib/utils";

export interface GameBreadcrumbProps {
  gameTitle: string;
  gameSlug: string;
  genreName: string;
  genreSlug: string;
  className?: string;
}

const BASE_URL = "https://theresalwaysadeal.com";

export default function GameBreadcrumb({
  gameTitle,
  gameSlug,
  genreName,
  genreSlug,
  className,
}: GameBreadcrumbProps) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: genreName,
        item: `${BASE_URL}/games/genre/${genreSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: gameTitle,
        item: `${BASE_URL}/games/${gameSlug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className={cn("text-sm text-muted", className)}>
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-primary hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/games/genre/${genreSlug}`}
              className="hover:text-primary hover:underline"
            >
              {genreName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-foreground">
            {gameTitle}
          </li>
        </ol>
      </nav>
    </>
  );
}
