import { cn } from "@/lib/utils";

interface BuyButtonProps {
  href: string;
  storeName: string;
  gameName?: string;
  className?: string;
}

export default function BuyButton({
  href,
  storeName,
  gameName,
  className,
}: BuyButtonProps) {
  const label = gameName
    ? `Buy ${gameName} on ${storeName}`
    : `Buy on ${storeName}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      Buy on {storeName}
    </a>
  );
}
