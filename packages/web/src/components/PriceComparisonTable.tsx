import { cn } from "@/lib/utils";
import BuyButton from "./BuyButton";
import PriceBadge from "./PriceBadge";
import DiscountBadge from "./DiscountBadge";
import StoreIcon from "./StoreIcon";

export interface StoreListingRow {
  storeName: string;
  storeUrl: string;
  storeLogoUrl?: string | null;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  lastChecked: string;
  isAllTimeLow: boolean;
  referralParam: string;
}

interface PriceComparisonTableProps {
  rows: StoreListingRow[];
  className?: string;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PriceComparisonTable({
  rows,
  className,
}: PriceComparisonTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="pb-2 pr-4 font-medium">Store</th>
            <th className="pb-2 pr-4 font-medium">Price</th>
            <th className="pb-2 pr-4 font-medium">Original</th>
            <th className="pb-2 pr-4 font-medium">Discount</th>
            <th className="pb-2 pr-4 font-medium">Last Checked</th>
            <th className="pb-2 font-medium">Buy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const buyHref = row.referralParam
              ? `${row.storeUrl}${row.storeUrl.includes("?") ? "&" : "?"}${row.referralParam}`
              : row.storeUrl;

            return (
              <tr
                key={row.storeName}
                className="border-b border-border last:border-0"
              >
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-2">
                    <StoreIcon
                      storeName={row.storeName}
                      logoUrl={row.storeLogoUrl}
                    />
                    <span>{row.storeName}</span>
                    {row.isAllTimeLow && (
                      <span className="rounded bg-success/20 px-1.5 py-0.5 text-xs font-semibold text-success">
                        ATL
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <PriceBadge currentPrice={row.currentPrice} />
                </td>
                <td className="py-3 pr-4">
                  <PriceBadge currentPrice={row.originalPrice} />
                </td>
                <td className="py-3 pr-4">
                  <DiscountBadge discount={row.discount} />
                </td>
                <td className="py-3 pr-4">{formatTimestamp(row.lastChecked)}</td>
                <td className="py-3">
                  <BuyButton href={buyHref} storeName={row.storeName} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
