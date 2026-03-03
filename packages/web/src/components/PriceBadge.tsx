import { cn } from "@/lib/utils";

interface PriceBadgeProps {
  currentPrice: number;
  originalPrice?: number;
  className?: string;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function PriceBadge({
  currentPrice,
  originalPrice,
  className,
}: PriceBadgeProps) {
  const hasDiscount =
    originalPrice !== undefined && originalPrice !== currentPrice;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="text-lg font-bold text-foreground">
        {formatPrice(currentPrice)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-muted-foreground line-through">
          {formatPrice(originalPrice)}
        </span>
      )}
    </div>
  );
}
