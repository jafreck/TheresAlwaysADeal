import { cn } from "@/lib/utils";
import PriceBadge from "./PriceBadge";
import DiscountBadge from "./DiscountBadge";
import BuyButton from "./BuyButton";

interface BestPriceCardProps {
  storeName: string;
  storeUrl: string;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  isAllTimeLow: boolean;
  referralParam: string;
  className?: string;
}

export default function BestPriceCard({
  storeName,
  storeUrl,
  currentPrice,
  originalPrice,
  discount,
  isAllTimeLow,
  referralParam,
  className,
}: BestPriceCardProps) {
  const buyHref = referralParam
    ? `${storeUrl}${storeUrl.includes("?") ? "&" : "?"}${referralParam}`
    : storeUrl;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-4 shadow-sm",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-muted mb-2">Best Price</h3>
      <p className="text-base font-medium mb-2">{storeName}</p>
      <div className="flex items-center gap-2 mb-3">
        <PriceBadge currentPrice={currentPrice} originalPrice={originalPrice} />
        {discount > 0 && <DiscountBadge discount={discount} />}
      </div>
      {isAllTimeLow && (
        <span className="inline-block rounded-md bg-success/20 px-2 py-0.5 text-xs font-semibold text-success mb-3">
          All-time low
        </span>
      )}
      <BuyButton href={buyHref} storeName={storeName} className="w-full" />
    </div>
  );
}
