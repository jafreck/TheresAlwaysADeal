import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock IntersectionObserver for jsdom
let lastObserverInstance: MockIntersectionObserver | null = null;
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {
    lastObserverInstance = this;
  }
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

const mockSetStore = vi.fn();
const mockSetMinDiscount = vi.fn();
const mockSetMaxPrice = vi.fn();
const mockSetSort = vi.fn();
const mockRefetch = vi.fn();

const mockFilters = {
  q: 'witcher',
  store: '',
  genre: '',
  min_discount: null as number | null,
  max_price: null as number | null,
  sort: 'best_match',
  page: 1,
};

vi.mock('@/lib/useSearchFilters', () => ({
  useSearchFilters: () => ({
    filters: mockFilters,
    setQ: vi.fn(),
    setStore: mockSetStore,
    setGenre: vi.fn(),
    setMinDiscount: mockSetMinDiscount,
    setMaxPrice: mockSetMaxPrice,
    setSort: mockSetSort,
    setPage: vi.fn(),
    setFilters: vi.fn(),
  }),
}));

const mockPages = [
  {
    data: [
      {
        title: 'The Witcher 3',
        slug: 'the-witcher-3',
        headerImageUrl: '/witcher3.jpg',
        currentPrice: 9.99,
        originalPrice: 39.99,
        discount: 75,
        storeName: 'Steam',
        storeLogoUrl: '/steam.png',
        storeUrl: 'https://store.steampowered.com/app/292030',
      },
    ] as Record<string, unknown>[],
    meta: { page: 1, total: 1, hasNext: false },
  },
];

const mockInfiniteQueryResult = {
  data: { pages: mockPages },
  isLoading: false,
  error: null as Error | null,
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
  refetch: mockRefetch,
};

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: vi.fn(() => mockInfiniteQueryResult),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    searchGames: vi.fn(),
  },
}));

vi.mock('@/components/FiltersPanel', () => ({
  default: function MockFiltersPanel(props: Record<string, unknown>) {
    return React.createElement('div', { 'data-testid': 'filters-panel', 'data-store': (props.values as Record<string, unknown>)?.store });
  },
}));

vi.mock('@/components/SearchResultsGrid', () => ({
  default: function MockSearchResultsGrid(props: Record<string, unknown>) {
    return React.createElement('div', {
      'data-testid': 'search-results-grid',
      'data-total': props.total,
      'data-query': props.query,
      'data-loading': String(props.isLoading),
      'data-error': props.error ?? '',
    });
  },
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: function MockLoadingSpinner() {
    return React.createElement('div', { 'data-testid': 'loading-spinner' });
  },
}));

import { useInfiniteQuery } from '@tanstack/react-query';
import SearchPage from '../../../src/app/search/page';

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilters.q = 'witcher';
    mockFilters.store = '';
    mockFilters.genre = '';
    mockFilters.min_discount = null;
    mockFilters.max_price = null;
    mockFilters.sort = 'best_match';
    mockFilters.page = 1;
    mockInfiniteQueryResult.data = { pages: mockPages };
    mockInfiniteQueryResult.isLoading = false;
    mockInfiniteQueryResult.error = null;
    mockInfiniteQueryResult.hasNextPage = false;
    mockInfiniteQueryResult.isFetchingNextPage = false;
  });

  it('should be a function (React component)', () => {
    expect(typeof SearchPage).toBe('function');
  });

  it('should render FiltersPanel', () => {
    const { container } = render(<SearchPage />);
    const filtersPanel = container.querySelector('[data-testid="filters-panel"]');
    expect(filtersPanel).toBeTruthy();
  });

  it('should render SearchResultsGrid', () => {
    const { container } = render(<SearchPage />);
    const grid = container.querySelector('[data-testid="search-results-grid"]');
    expect(grid).toBeTruthy();
  });

  it('should pass total to SearchResultsGrid', () => {
    const { container } = render(<SearchPage />);
    const grid = container.querySelector('[data-testid="search-results-grid"]');
    expect(grid?.getAttribute('data-total')).toBe('1');
  });

  it('should pass query to SearchResultsGrid', () => {
    const { container } = render(<SearchPage />);
    const grid = container.querySelector('[data-testid="search-results-grid"]');
    expect(grid?.getAttribute('data-query')).toBe('witcher');
  });

  it('should pass isLoading to SearchResultsGrid', () => {
    mockInfiniteQueryResult.isLoading = true;
    const { container } = render(<SearchPage />);
    const grid = container.querySelector('[data-testid="search-results-grid"]');
    expect(grid?.getAttribute('data-loading')).toBe('true');
  });

  it('should pass error message to SearchResultsGrid when error exists', () => {
    mockInfiniteQueryResult.error = new Error('Network failure');
    const { container } = render(<SearchPage />);
    const grid = container.querySelector('[data-testid="search-results-grid"]');
    expect(grid?.getAttribute('data-error')).toBe('Network failure');
  });

  it('should set document title based on query', () => {
    render(<SearchPage />);
    expect(document.title).toBe('Search Results for "witcher" | There\'s Always A Deal');
  });

  it('should set generic document title when query is empty', () => {
    mockFilters.q = '';
    render(<SearchPage />);
    expect(document.title).toBe("Search | There's Always A Deal");
  });

  it('should render loading spinner in Suspense fallback wrapper', () => {
    // The SearchPage wraps content in Suspense; verify the outer structure renders
    const { container } = render(<SearchPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should show loading spinner when fetching next page', () => {
    mockInfiniteQueryResult.isFetchingNextPage = true;
    const { container } = render(<SearchPage />);
    const spinner = container.querySelector('[data-testid="loading-spinner"]');
    expect(spinner).toBeTruthy();
  });

  it('should not show loading spinner when not fetching next page', () => {
    mockInfiniteQueryResult.isFetchingNextPage = false;
    const { container } = render(<SearchPage />);
    const spinners = container.querySelectorAll('[data-testid="loading-spinner"]');
    // Only the Suspense fallback spinner should not be visible
    expect(spinners.length).toBe(0);
  });

  it('should handle empty data pages gracefully', () => {
    mockInfiniteQueryResult.data = { pages: [] };
    const { container } = render(<SearchPage />);
    const grid = container.querySelector('[data-testid="search-results-grid"]');
    expect(grid).toBeTruthy();
    expect(grid?.getAttribute('data-total')).toBe('0');
  });

  it('should handle null data gracefully', () => {
    mockInfiniteQueryResult.data = null as unknown as { pages: typeof mockPages };
    const { container } = render(<SearchPage />);
    const grid = container.querySelector('[data-testid="search-results-grid"]');
    expect(grid).toBeTruthy();
  });
});

describe('mapResultToCard', () => {
  // We test the mapping logic indirectly through the SearchPage rendering.
  // mapResultToCard is a private function but we can verify its behavior
  // by checking that results render correctly with both camelCase and snake_case.

  it('should handle camelCase API response fields', () => {
    mockInfiniteQueryResult.data = {
      pages: [{
        data: [{
          title: 'Test Game',
          slug: 'test-game',
          headerImageUrl: '/test.jpg',
          currentPrice: 5.99,
          originalPrice: 19.99,
          discount: 70,
          storeName: 'GOG',
          storeLogoUrl: '/gog.png',
          storeUrl: 'https://gog.com/game/test',
        }],
        meta: { page: 1, total: 1, hasNext: false },
      }],
    };
    const { container } = render(<SearchPage />);
    const grid = container.querySelector('[data-testid="search-results-grid"]');
    expect(grid).toBeTruthy();
  });

  it('should handle snake_case API response fields', () => {
    mockInfiniteQueryResult.data = {
      pages: [{
        data: [{
          title: 'Test Game',
          slug: 'test-game',
          header_image_url: '/test.jpg',
          current_price: 5.99,
          original_price: 19.99,
          discount: 70,
          store_name: 'GOG',
          store_logo_url: '/gog.png',
          store_url: 'https://gog.com/game/test',
        }],
        meta: { page: 1, total: 1, hasNext: false },
      }],
    };
    const { container } = render(<SearchPage />);
    const grid = container.querySelector('[data-testid="search-results-grid"]');
    expect(grid).toBeTruthy();
  });

  it('should handle missing optional fields with defaults', () => {
    mockInfiniteQueryResult.data = {
      pages: [{
        data: [{
          title: 'Minimal Game',
          slug: 'minimal-game',
        }],
        meta: { page: 1, total: 1, hasNext: false },
      }],
    };
    const { container } = render(<SearchPage />);
    const grid = container.querySelector('[data-testid="search-results-grid"]');
    expect(grid).toBeTruthy();
    expect(grid?.getAttribute('data-total')).toBe('1');
  });
});

describe('SearchPage useInfiniteQuery configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilters.q = 'witcher';
    mockFilters.store = '';
    mockFilters.genre = '';
    mockFilters.min_discount = null;
    mockFilters.max_price = null;
    mockFilters.sort = 'best_match';
    mockFilters.page = 1;
    mockInfiniteQueryResult.data = { pages: mockPages };
    mockInfiniteQueryResult.isLoading = false;
    mockInfiniteQueryResult.error = null;
    mockInfiniteQueryResult.hasNextPage = false;
    mockInfiniteQueryResult.isFetchingNextPage = false;
  });

  it('should pass filter values in the query key', () => {
    render(<SearchPage />);
    const calls = (useInfiniteQuery as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const config = calls[0][0] as Record<string, unknown>;
    const queryKey = config.queryKey as unknown[];
    expect(queryKey[0]).toBe('searchGames');
    expect(queryKey[1]).toBe('witcher');
  });

  it('should be disabled when query is empty', () => {
    mockFilters.q = '';
    render(<SearchPage />);
    const calls = (useInfiniteQuery as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const config = calls[0][0] as Record<string, unknown>;
    expect(config.enabled).toBe(false);
  });

  it('should be enabled when query is non-empty', () => {
    mockFilters.q = 'portal';
    render(<SearchPage />);
    const calls = (useInfiniteQuery as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const config = calls[0][0] as Record<string, unknown>;
    expect(config.enabled).toBe(true);
  });

  it('should set initialPageParam to 1', () => {
    render(<SearchPage />);
    const calls = (useInfiniteQuery as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const config = calls[0][0] as Record<string, unknown>;
    expect(config.initialPageParam).toBe(1);
  });

  it('should include store and sort in query key', () => {
    mockFilters.store = 'Steam';
    mockFilters.sort = 'lowest_price';
    render(<SearchPage />);
    const calls = (useInfiniteQuery as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const config = calls[0][0] as Record<string, unknown>;
    const queryKey = config.queryKey as unknown[];
    expect(queryKey).toContain('Steam');
    expect(queryKey).toContain('lowest_price');
  });
});

describe('SearchPage IntersectionObserver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastObserverInstance = null;
    mockFilters.q = 'witcher';
    mockInfiniteQueryResult.data = { pages: mockPages };
    mockInfiniteQueryResult.isLoading = false;
    mockInfiniteQueryResult.error = null;
    mockInfiniteQueryResult.hasNextPage = false;
    mockInfiniteQueryResult.isFetchingNextPage = false;
  });

  it('should create IntersectionObserver on mount', () => {
    render(<SearchPage />);
    expect(lastObserverInstance).toBeTruthy();
    expect(lastObserverInstance!.observe).toHaveBeenCalled();
  });

  it('should disconnect IntersectionObserver on unmount', () => {
    const { unmount } = render(<SearchPage />);
    const observer = lastObserverInstance!;
    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
  });
});
