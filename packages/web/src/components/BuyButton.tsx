import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface BuyButtonProps {
  href: string;
  storeName: string;
  referralUrl?: string;
  className?: string;
}

export default function BuyButton({
  href,
  storeName,
  referralUrl,
  className,
}: BuyButtonProps) {
  return (
    <a
      href={referralUrl ?? href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: "default", size: "sm" }),
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className,
      )}
    >
      Buy on {storeName}
    </a>
  );
}
