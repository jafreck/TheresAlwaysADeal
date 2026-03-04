"use client";

import { useQueryStates, parseAsString, parseAsInteger, parseAsFloat } from "nuqs";

const searchParamsParsers = {
  q: parseAsString.withDefault(""),
  store: parseAsString.withDefault(""),
  genre: parseAsString.withDefault(""),
  min_discount: parseAsInteger,
  max_price: parseAsFloat,
  sort: parseAsString.withDefault("best_match"),
  page: parseAsInteger.withDefault(1),
};

export function useSearchFilters() {
  const [filters, setFilters] = useQueryStates(searchParamsParsers, {
    history: "push",
  });

  const setQ = (q: string) => setFilters({ q, page: 1 });
  const setStore = (store: string) => setFilters({ store, page: 1 });
  const setGenre = (genre: string) => setFilters({ genre, page: 1 });
  const setMinDiscount = (min_discount: number | null) =>
    setFilters({ min_discount, page: 1 });
  const setMaxPrice = (max_price: number | null) =>
    setFilters({ max_price, page: 1 });
  const setSort = (sort: string) => setFilters({ sort, page: 1 });
  const setPage = (page: number) => setFilters({ page });

  return {
    filters,
    setQ,
    setStore,
    setGenre,
    setMinDiscount,
    setMaxPrice,
    setSort,
    setPage,
    setFilters,
  };
}
