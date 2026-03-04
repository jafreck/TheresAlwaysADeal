"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const STORES = ["Steam", "GOG", "Epic", "Humble", "Fanatical"] as const;

const DISCOUNT_PRESETS = [
  { label: "25%+", value: 25 },
  { label: "50%+", value: 50 },
  { label: "75%+", value: 75 },
  { label: "90%+", value: 90 },
] as const;

const MAX_PRICE_OPTIONS = [
  { label: "Free only", value: 0 },
  { label: "$5", value: 5 },
  { label: "$10", value: 10 },
  { label: "$20", value: 20 },
  { label: "$30", value: 30 },
] as const;

const SORT_OPTIONS = [
  { label: "Best Match", value: "best_match" },
  { label: "Highest Discount", value: "highest_discount" },
  { label: "Lowest Price", value: "lowest_price" },
  { label: "A\u2013Z", value: "a_z" },
  { label: "Release Date", value: "release_date" },
] as const;

export interface FilterValues {
  store: string;
  min_discount: number | null;
  max_price: number | null;
  sort: string;
}

export interface FiltersPanelProps {
  values: FilterValues;
  onStoreChange: (store: string) => void;
  onMinDiscountChange: (discount: number | null) => void;
  onMaxPriceChange: (price: number | null) => void;
  onSortChange: (sort: string) => void;
}

function FilterContent({
  values,
  onStoreChange,
  onMinDiscountChange,
  onMaxPriceChange,
  onSortChange,
}: FiltersPanelProps) {
  const selectedStores = values.store ? values.store.split(",") : [];

  function toggleStore(store: string) {
    const updated = selectedStores.includes(store)
      ? selectedStores.filter((s) => s !== store)
      : [...selectedStores, store];
    onStoreChange(updated.join(","));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stores */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-zinc-300">
          Store
        </legend>
        <div className="flex flex-col gap-2">
          {STORES.map((store) => (
            <label
              key={store}
              className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300"
            >
              <input
                type="checkbox"
                checked={selectedStores.includes(store)}
                onChange={() => toggleStore(store)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-primary accent-primary"
              />
              {store}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Discount presets */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-zinc-300">
          Minimum Discount
        </legend>
        <div className="flex flex-wrap gap-2">
          {DISCOUNT_PRESETS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                onMinDiscountChange(values.min_discount === value ? null : value)
              }
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                values.min_discount === value
                  ? "bg-primary text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Max price */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-zinc-300">
          Max Price
        </legend>
        <div className="flex flex-wrap gap-2">
          {MAX_PRICE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                onMaxPriceChange(values.max_price === value ? null : value)
              }
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                values.max_price === value
                  ? "bg-primary text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Sort */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-zinc-300">
          Sort By
        </legend>
        <select
          value={values.sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SORT_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </fieldset>
    </div>
  );
}

export default function FiltersPanel(props: FiltersPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-4 rounded-xl border border-zinc-800 bg-surface p-4">
          <h2 className="mb-4 text-base font-semibold">Filters</h2>
          <FilterContent {...props} />
        </div>
      </aside>

      {/* Mobile drawer trigger */}
      <div className="md:hidden">
        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              Filters
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-zinc-900 p-6 shadow-xl focus:outline-none">
              <div className="mb-4 flex items-center justify-between">
                <Dialog.Title className="text-base font-semibold">
                  Filters
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-md p-1 text-zinc-400 hover:text-zinc-200"
                    aria-label="Close filters"
                  >
                    ✕
                  </button>
                </Dialog.Close>
              </div>
              <FilterContent {...props} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
