import Image from "next/image";
import { cn } from "@/lib/utils";
import { PriceBadge } from "@/components/PriceBadge";
import { DiscountBadge } from "@/components/DiscountBadge";
import { StoreIcon } from "@/components/StoreIcon";
import BuyButton from "@/components/BuyButton";

interface GameCardProps {
  title: string;
  imageUrl: string;
  currentPrice: number;
  originalPrice?: number;
  discount?: number;
  storeName: string;
  storeUrl: string;
  referralUrl?: string;
  className?: string;
}

export function GameCard({
  title,
  imageUrl,
  currentPrice,
  originalPrice,
  discount,
  storeName,
  storeUrl,
  referralUrl,
  className,
}: GameCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-muted bg-surface shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {discount !== undefined && discount > 0 && (
            <DiscountBadge discount={discount} />
          )}
          <PriceBadge currentPrice={currentPrice} originalPrice={originalPrice} />
        </div>
        <div className="flex items-center justify-between">
          <StoreIcon storeName={storeName} size={24} />
          <BuyButton
            href={storeUrl}
            storeName={storeName}
            referralUrl={referralUrl}
          />
        </div>
      </div>
    </div>
  );
}
