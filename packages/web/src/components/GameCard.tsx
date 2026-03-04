import Image from "next/image";
import { cn } from "@/lib/utils";
import PriceBadge from "./PriceBadge";
import DiscountBadge from "./DiscountBadge";
import BuyButton from "./BuyButton";
import StoreIcon from "./StoreIcon";

export interface GameCardProps {
  gameTitle: string;
  gameSlug: string;
  headerImageUrl: string;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  storeName: string;
  storeLogoUrl?: string | null;
  storeUrl: string;
  className?: string;
}

export default function GameCard({
  gameTitle,
  gameSlug: _gameSlug,
  headerImageUrl,
  currentPrice,
  originalPrice,
  discount,
  storeName,
  storeLogoUrl,
  storeUrl,
  className,
}: GameCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary",
        className,
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={headerImageUrl}
          alt={gameTitle}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-tight">
          {gameTitle}
        </h3>

        <div className="flex items-center gap-2">
          <StoreIcon storeName={storeName} logoUrl={storeLogoUrl} size={20} />
          <span className="text-sm text-muted">{storeName}</span>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <PriceBadge
            currentPrice={currentPrice}
            originalPrice={originalPrice}
          />
          {discount > 0 && <DiscountBadge discount={discount} />}
        </div>

        <BuyButton
          href={storeUrl}
          storeName={storeName}
          gameName={gameTitle}
          className="w-full"
        />
      </div>
    </article>
  );
}
