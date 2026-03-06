import type { PriceHistoryEntry } from "@/lib/api-client";

/** Display-oriented price entry (transformed from API's PriceHistoryEntry). */
export interface ChartPriceEntry {
  storeListingId: string;
  price: number;
  recordedAt: string;
}

/** Convert API PriceHistoryEntry items to display-oriented ChartPriceEntry items. */
export function toChartEntries(entries: PriceHistoryEntry[]): ChartPriceEntry[] {
  return entries.map((e) => ({
    storeListingId: String(e.storeListingId),
    price: Number(e.price),
    recordedAt: e.recordedAt,
  }));
}
