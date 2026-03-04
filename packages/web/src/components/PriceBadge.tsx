import { cn } from "@/lib/utils";

interface PriceBadgeProps {
  currentPrice: number;
  originalPrice?: number;
  currency?: string;
  className?: string;
}

export default function PriceBadge({
  currentPrice,
  originalPrice,
  currency = "USD",
  className,
}: PriceBadgeProps) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  });

  const showOriginal =
    originalPrice !== undefined && originalPrice !== currentPrice;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {showOriginal && (
        <span className="text-muted line-through text-sm">
          {formatter.format(originalPrice)}
        </span>
      )}
      <span className="font-bold text-lg">{formatter.format(currentPrice)}</span>
    </span>
  );
}
