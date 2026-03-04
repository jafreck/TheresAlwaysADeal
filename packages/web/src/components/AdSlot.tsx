"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useConsent } from "@/lib/consent";

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdSlotConfig {
  slot: string;
  format: string;
  height: number;
}

const AD_SLOTS: Record<string, AdSlotConfig> = {
  "above-fold": { slot: "1234567890", format: "horizontal", height: 90 },
  "mid-page": { slot: "1234567891", format: "rectangle", height: 250 },
  "game-detail-sidebar": { slot: "1234567892", format: "vertical", height: 600 },
  "search-results-inline": { slot: "1234567893", format: "horizontal", height: 90 },
  "dashboard-banner": { slot: "1234567894", format: "horizontal", height: 90 },
};

interface AdSlotProps {
  slotId: string;
  className?: string;
}

export default function AdSlot({ slotId, className }: AdSlotProps) {
  const [mounted, setMounted] = useState(false);
  const { consentStatus } = useConsent();

  const config = AD_SLOTS[slotId] ?? {
    slot: "0000000000",
    format: "auto",
    height: 90,
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || process.env.NODE_ENV !== "production") return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded yet
    }
  }, [mounted]);

  if (!mounted) return null;

  if (process.env.NODE_ENV !== "production") {
    return (
      <div
        data-slot={slotId}
        className={cn(
          "flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 text-gray-400 text-sm",
          className,
        )}
        style={{ minHeight: config.height }}
      >
        Ad Slot: {slotId}
      </div>
    );
  }

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{ minHeight: config.height }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={publisherId}
        data-ad-slot={config.slot}
        data-ad-format={config.format}
        data-full-width-responsive="true"
        {...(consentStatus !== "granted" ? { "data-ad-npa": "1" } : {})}
      />
    </div>

  );
}
