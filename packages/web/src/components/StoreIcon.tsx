import { cn } from "@/lib/utils";

interface StoreIconProps {
  storeName: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}

export default function StoreIcon({
  storeName,
  logoUrl,
  size = 24,
  className,
}: StoreIconProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${storeName} logo`}
        width={size}
        height={size}
        className={cn("inline-block rounded", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded bg-surface text-xs font-semibold uppercase text-muted",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={`${storeName} logo`}
    >
      {storeName.slice(0, 2)}
    </span>
  );
}
