import { cn } from "@/lib/utils";

interface DiscountBadgeProps {
  discount: number;
  className?: string;
}

export default function DiscountBadge({
  discount,
  className,
}: DiscountBadgeProps) {
  const colorClass =
    discount >= 50
      ? "bg-danger/20 text-danger"
      : discount >= 25
        ? "bg-warning/20 text-warning"
        : "bg-success/20 text-success";

  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-sm font-semibold",
        colorClass,
        className,
      )}
    >
      -{Math.round(discount)}%
    </span>
  );
}
