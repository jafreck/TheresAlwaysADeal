import { cn } from "@/lib/utils";

interface DiscountBadgeProps {
  discount: number;
  className?: string;
}

export function DiscountBadge({ discount, className }: DiscountBadgeProps) {
  const colorClass =
    discount >= 50
      ? "bg-green-600 text-white"
      : discount >= 25
        ? "bg-yellow-500 text-black"
        : "bg-surface text-surface-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        colorClass,
        className,
      )}
    >
      -{discount}%
    </span>
  );
}
