import Link from "next/link";
import { cn } from "@/lib/utils";

export interface GameBreadcrumbProps {
  gameTitle: string;
  genreName: string;
  genreSlug: string;
  className?: string;
}

export default function GameBreadcrumb({
  gameTitle,
  genreName,
  genreSlug,
  className,
}: GameBreadcrumbProps) {
  return (
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
            href={`/games?genre=${genreSlug}`}
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
  );
}
