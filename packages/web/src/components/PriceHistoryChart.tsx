"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export type { ChartPriceEntry } from "@/lib/price-history";
export { toChartEntries } from "@/lib/price-history";
import type { ChartPriceEntry } from "@/lib/price-history";

interface PriceHistoryChartProps {
  entries: ChartPriceEntry[];
  storeNames: Record<string, string>;
  className?: string;
}

type DateRange = "3M" | "6M" | "1Y" | "All";

const STORE_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

function getDateThreshold(range: DateRange): Date | null {
  if (range === "All") return null;
  const now = new Date();
  const months = range === "3M" ? 3 : range === "6M" ? 6 : 12;
  now.setMonth(now.getMonth() - months);
  return now;
}

export default function PriceHistoryChart({
  entries,
  storeNames,
  className,
}: PriceHistoryChartProps) {
  const [range, setRange] = useState<DateRange>("All");
  const storeIds = useMemo(
    () => [...new Set(entries.map((e) => e.storeListingId))],
    [entries],
  );
  const [enabledStores, setEnabledStores] = useState<Set<string>>(
    () => new Set(storeIds),
  );

  useEffect(() => {
    setEnabledStores((prev) => {
      const next = new Set(prev);
      for (const id of storeIds) {
        if (!prev.has(id)) next.add(id);
      }
      return next.size !== prev.size ? next : prev;
    });
  }, [storeIds]);

  const filteredEntries = useMemo(() => {
    const threshold = getDateThreshold(range);
    return threshold
      ? entries.filter((e) => new Date(e.recordedAt) >= threshold)
      : entries;
  }, [entries, range]);

  const allTimeLow = useMemo(
    () =>
      entries.length > 0
        ? Math.min(...entries.map((e) => e.price))
        : undefined,
    [entries],
  );

  // Pivot entries into { date, [storeId]: price } rows for Recharts
  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const e of filteredEntries) {
      const dateKey = new Date(e.recordedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      });
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, { date: dateKey });
      }
      byDate.get(dateKey)![e.storeListingId] = e.price;
    }
    return [...byDate.values()];
  }, [filteredEntries]);

  const toggleStore = (id: string) => {
    setEnabledStores((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ranges: DateRange[] = ["3M", "6M", "1Y", "All"];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex gap-2" role="group" aria-label="Store toggles">
          {storeIds.map((id, i) => (
            <label key={id} className="inline-flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={enabledStores.has(id)}
                onChange={() => toggleStore(id)}
                aria-label={`Toggle ${storeNames[id] ?? id}`}
              />
              <span style={{ color: STORE_COLORS[i % STORE_COLORS.length] }}>
                {storeNames[id] ?? id}
              </span>
            </label>
          ))}
        </div>
        <div
          className="flex gap-1"
          role="group"
          aria-label="Date range selector"
        >
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium",
                range === r
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:bg-surface/80",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => `$${v}`}
            label={{
              value: "Price (USD)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip formatter={(v: number | undefined) => v != null ? `$${v.toFixed(2)}` : ""} />
          {storeIds.map(
            (id, i) =>
              enabledStores.has(id) && (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={storeNames[id] ?? id}
                  stroke={STORE_COLORS[i % STORE_COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ),
          )}
          {allTimeLow !== undefined && (
            <ReferenceLine
              y={allTimeLow}
              stroke="#10b981"
              strokeDasharray="4 4"
              label={{
                value: `ATL $${allTimeLow.toFixed(2)}`,
                position: "right",
                fontSize: 12,
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
