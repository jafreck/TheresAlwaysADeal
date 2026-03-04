"use client";

import { useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";

interface WishlistButtonProps {
  gameId: number;
  initialIsWishlisted: boolean;
  className?: string;
}

export default function WishlistButton({
  gameId,
  initialIsWishlisted,
  className,
}: WishlistButtonProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const prev = isWishlisted;
    setIsWishlisted(!prev);
    setIsLoading(true);

    try {
      await apiClient.toggleWishlist(gameId);
    } catch {
      setIsWishlisted(prev);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, gameId, isWishlisted]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWishlisted}
      title={!accessToken ? "Log in to add to wishlist" : undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-lg p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        isWishlisted
          ? "text-red-500 hover:text-red-600"
          : "text-muted hover:text-foreground",
        !accessToken && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <Heart
        className={cn("h-5 w-5", isWishlisted && "fill-current")}
        aria-hidden="true"
      />
    </button>
  );
}
