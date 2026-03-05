import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSetFilters = vi.fn();

vi.mock('nuqs', () => ({
  useQueryStates: () => [
    {
      q: '',
      store: '',
      genre: '',
      min_discount: null,
      max_price: null,
      sort: 'best_match',
      page: 1,
    },
    mockSetFilters,
  ],
  parseAsString: {
    withDefault: (v: string) => ({ defaultValue: v }),
  },
  parseAsInteger: {
    withDefault: (v: number) => ({ defaultValue: v }),
  },
  parseAsFloat: {
    withDefault: (v: number) => ({ defaultValue: v }),
  },
}));

import { useSearchFilters } from '../../src/lib/useSearchFilters';

describe('useSearchFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a function', () => {
    expect(typeof useSearchFilters).toBe('function');
  });

  it('should return filters object', () => {
    const result = useSearchFilters();
    expect(result.filters).toBeDefined();
    expect(result.filters.q).toBe('');
    expect(result.filters.store).toBe('');
    expect(result.filters.genre).toBe('');
    expect(result.filters.min_discount).toBeNull();
    expect(result.filters.max_price).toBeNull();
    expect(result.filters.sort).toBe('best_match');
    expect(result.filters.page).toBe(1);
  });

  it('should return setter functions', () => {
    const result = useSearchFilters();
    expect(typeof result.setQ).toBe('function');
    expect(typeof result.setStore).toBe('function');
    expect(typeof result.setGenre).toBe('function');
    expect(typeof result.setMinDiscount).toBe('function');
    expect(typeof result.setMaxPrice).toBe('function');
    expect(typeof result.setSort).toBe('function');
    expect(typeof result.setPage).toBe('function');
    expect(typeof result.setFilters).toBe('function');
  });

  it('should call setFilters with q and page=1 when setQ is called', () => {
    const result = useSearchFilters();
    result.setQ('portal');
    expect(mockSetFilters).toHaveBeenCalledWith({ q: 'portal', page: 1 });
  });

  it('should call setFilters with store and page=1 when setStore is called', () => {
    const result = useSearchFilters();
    result.setStore('Steam');
    expect(mockSetFilters).toHaveBeenCalledWith({ store: 'Steam', page: 1 });
  });

  it('should call setFilters with genre and page=1 when setGenre is called', () => {
    const result = useSearchFilters();
    result.setGenre('action');
    expect(mockSetFilters).toHaveBeenCalledWith({ genre: 'action', page: 1 });
  });

  it('should call setFilters with min_discount and page=1 when setMinDiscount is called', () => {
    const result = useSearchFilters();
    result.setMinDiscount(50);
    expect(mockSetFilters).toHaveBeenCalledWith({ min_discount: 50, page: 1 });
  });

  it('should call setFilters with null min_discount and page=1 when clearing discount', () => {
    const result = useSearchFilters();
    result.setMinDiscount(null);
    expect(mockSetFilters).toHaveBeenCalledWith({ min_discount: null, page: 1 });
  });

  it('should call setFilters with max_price and page=1 when setMaxPrice is called', () => {
    const result = useSearchFilters();
    result.setMaxPrice(20);
    expect(mockSetFilters).toHaveBeenCalledWith({ max_price: 20, page: 1 });
  });

  it('should call setFilters with null max_price and page=1 when clearing price', () => {
    const result = useSearchFilters();
    result.setMaxPrice(null);
    expect(mockSetFilters).toHaveBeenCalledWith({ max_price: null, page: 1 });
  });

  it('should call setFilters with sort and page=1 when setSort is called', () => {
    const result = useSearchFilters();
    result.setSort('lowest_price');
    expect(mockSetFilters).toHaveBeenCalledWith({ sort: 'lowest_price', page: 1 });
  });

  it('should call setFilters with only page when setPage is called', () => {
    const result = useSearchFilters();
    result.setPage(3);
    expect(mockSetFilters).toHaveBeenCalledWith({ page: 3 });
  });

  it('should expose raw setFilters for custom updates', () => {
    const result = useSearchFilters();
    expect(result.setFilters).toBe(mockSetFilters);
  });
});
