import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-api module
vi.mock('../../src/lib/server-api', () => ({
  serverApi: {
    get: vi.fn(),
  },
  ServerApiError: class extends Error {
    status: number;
    statusText: string;
    constructor(status: number, statusText: string) {
      super(`Server API error ${status}: ${statusText}`);
      this.name = 'ServerApiError';
      this.status = status;
      this.statusText = statusText;
    }
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: function MockLink({ children, href, ...props }: Record<string, unknown>) {
    return { type: 'a', props: { href, ...props, children }, key: null };
  },
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage(props: Record<string, unknown>) {
    return { type: 'img', props, key: null };
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

// Mock api-client
vi.mock('../../src/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

import { serverApi } from '../../src/lib/server-api';

const mockDeals = [
  {
    gameTitle: 'Test Game',
    gameSlug: 'test-game',
    headerImageUrl: 'https://example.com/img.jpg',
    price: 9.99,
    originalPrice: 19.99,
    discount: 50,
    storeName: 'Steam',
    storeLogoUrl: null,
    storeUrl: 'https://store.example.com',
    dealScore: 8.5,
  },
];

const mockFreeGames = [
  {
    gameTitle: 'Free Game',
    gameSlug: 'free-game',
    headerImageUrl: 'https://example.com/free.jpg',
    storeName: 'Epic',
    storeLogoUrl: null,
    storeUrl: 'https://epic.example.com',
    saleEndsAt: null,
    expiresAt: null,
  },
];

function setupMocks(featuredDeals = mockDeals, freeGames = mockFreeGames, trendingDeals = mockDeals) {
  const mockGet = vi.mocked(serverApi.get);
  mockGet.mockReset();
  mockGet
    .mockResolvedValueOnce({ data: featuredDeals })
    .mockResolvedValueOnce({ data: freeGames })
    .mockResolvedValueOnce({ data: trendingDeals });
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should export revalidate = 900 for ISR', async () => {
    const pageModule = await import('../../src/app/page');
    expect(pageModule.revalidate).toBe(900);
  });

  it('should export metadata with homepage title', async () => {
    const pageModule = await import('../../src/app/page');
    const meta = pageModule.metadata;
    expect(meta).toBeDefined();
    expect(meta!.title).toContain('Best Game Deals');
  });

  it('should export metadata with OG images', async () => {
    const pageModule = await import('../../src/app/page');
    const meta = pageModule.metadata;
    expect(meta!.openGraph).toBeDefined();
    const og = meta!.openGraph as { images: { url: string }[] };
    expect(og.images).toBeDefined();
    expect(og.images.length).toBeGreaterThan(0);
  });

  it('should be an async function (server component)', async () => {
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    expect(typeof HomePage).toBe('function');
    // Async functions return a Promise
    setupMocks();
    const result = HomePage();
    expect(result).toBeInstanceOf(Promise);
  });

  it('should fetch featured deals, free games, and trending deals', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    await HomePage();

    const mockGet = vi.mocked(serverApi.get);
    expect(mockGet).toHaveBeenCalledTimes(3);
    expect(mockGet).toHaveBeenCalledWith('/deals?limit=10', 900);
    expect(mockGet).toHaveBeenCalledWith('/deals/free?limit=10', 900);
    expect(mockGet).toHaveBeenCalledWith('/deals?limit=12', 900);
  });

  it('should render all sections in order', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    // Flatten the children to find section components
    expect(children).toBeDefined();
    expect(Array.isArray(children)).toBe(true);

    // SearchHero is first
    const searchHero = children[0];
    expect(searchHero).toBeTruthy();

    // AdSlot (above-fold) is second
    const aboveFoldAd = children[1];
    expect(aboveFoldAd.props.slotId).toBe('above-fold');

    // AdSlot (mid-page) is fifth
    const midPageAd = children[4];
    expect(midPageAd.props.slotId).toBe('mid-page');
  });

  it('should pass deals data to FeaturedDealsSection', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    // FeaturedDealsSection is wrapped in a div (children[2])
    const featuredWrapper = children[2];
    const featuredSection = featuredWrapper.props.children;
    expect(featuredSection.props.deals).toEqual(mockDeals);
  });

  it('should pass free games data to FreeGamesSection', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    // FreeGamesSection is wrapped in a div (children[3])
    const freeGamesWrapper = children[3];
    const freeGamesSection = freeGamesWrapper.props.children;
    expect(freeGamesSection.props.games).toEqual(mockFreeGames);
  });

  it('should pass trending deals data to TrendingDealsSection', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    // TrendingDealsSection is inside Suspense (children[5]) > div > component
    const suspense = children[5];
    const wrapper = suspense.props.children;
    const trendingSection = wrapper.props.children;
    expect(trendingSection.props.deals).toEqual(mockDeals);
  });

  it('should render GenreBrowseSection', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    // GenreBrowseSection is wrapped in a div (children[6])
    const genreWrapper = children[6];
    expect(genreWrapper).toBeTruthy();
  });

  it('should render RecentlyViewedSection inside Suspense', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    // RecentlyViewedSection is inside Suspense (children[7]) > div > component
    const suspense = children[7];
    expect(suspense).toBeTruthy();
    const wrapper = suspense.props.children;
    expect(wrapper).toBeTruthy();
  });

  it('should render ad slot placeholders', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    const aboveFoldAd = children[1];
    const midPageAd = children[4];
    expect(aboveFoldAd.props.slotId).toBe('above-fold');
    expect(midPageAd.props.slotId).toBe('mid-page');
  });

  it('should handle empty API responses gracefully', async () => {
    setupMocks([], [], []);
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    // FeaturedDealsSection gets empty array
    const featuredWrapper = children[2];
    const featuredSection = featuredWrapper.props.children;
    expect(featuredSection.props.deals).toEqual([]);

    // FreeGamesSection gets empty array
    const freeGamesWrapper = children[3];
    const freeGamesSection = freeGamesWrapper.props.children;
    expect(freeGamesSection.props.games).toEqual([]);
  });

  it('should handle API errors gracefully by returning empty arrays', async () => {
    const mockGet = vi.mocked(serverApi.get);
    mockGet.mockReset();
    mockGet.mockRejectedValue(new Error('Network error'));

    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    const featuredWrapper = children[2];
    const featuredSection = featuredWrapper.props.children;
    expect(featuredSection.props.deals).toEqual([]);
  });

  it('should export metadata with description containing key terms', async () => {
    const pageModule = await import('../../src/app/page');
    const meta = pageModule.metadata;
    expect(meta!.description).toBeDefined();
    const desc = meta!.description as string;
    expect(desc).toContain('Steam');
    expect(desc).toContain('GOG');
    expect(desc).toContain('Epic');
    expect(desc).toContain('game deals');
    expect(desc).toContain('price comparison');
  });

  it('should export metadata with OG image path and dimensions', async () => {
    const pageModule = await import('../../src/app/page');
    const og = pageModule.metadata!.openGraph as { images: { url: string; width: number; height: number }[] };
    expect(og.images[0].url).toBe('/og-home.png');
    expect(og.images[0].width).toBe(1200);
    expect(og.images[0].height).toBe(630);
  });

  it('should export OG title matching page title', async () => {
    const pageModule = await import('../../src/app/page');
    const meta = pageModule.metadata!;
    const og = meta.openGraph as { title: string; description: string };
    expect(og.title).toBe(meta.title);
    expect(og.description).toBe(meta.description);
  });

  it('should handle partial API failures gracefully', async () => {
    const mockGet = vi.mocked(serverApi.get);
    mockGet.mockReset();
    mockGet
      .mockResolvedValueOnce({ data: mockDeals })
      .mockRejectedValueOnce(new Error('Free games API down'))
      .mockResolvedValueOnce({ data: mockDeals });

    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    // FeaturedDealsSection should still have data
    const featuredWrapper = children[2];
    const featuredSection = featuredWrapper.props.children;
    expect(featuredSection.props.deals).toEqual(mockDeals);

    // FreeGamesSection should get empty array from failed fetch
    const freeGamesWrapper = children[3];
    const freeGamesSection = freeGamesWrapper.props.children;
    expect(freeGamesSection.props.games).toEqual([]);

    // TrendingDealsSection should still have data
    const suspense = children[5];
    const wrapper = suspense.props.children;
    const trendingSection = wrapper.props.children;
    expect(trendingSection.props.deals).toEqual(mockDeals);
  });

  it('should render root container with flex column layout', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    expect(element.type).toBe('div');
    expect(element.props.className).toContain('flex');
    expect(element.props.className).toContain('flex-col');
  });

  it('should pass multiple deals through to section components', async () => {
    const multipleDeals = [
      { ...mockDeals[0], gameTitle: 'Game A' },
      { ...mockDeals[0], gameTitle: 'Game B' },
      { ...mockDeals[0], gameTitle: 'Game C' },
    ];
    const multipleFreeGames = [
      { ...mockFreeGames[0], gameTitle: 'Free A' },
      { ...mockFreeGames[0], gameTitle: 'Free B' },
    ];
    setupMocks(multipleDeals, multipleFreeGames, multipleDeals);
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    const featuredSection = children[2].props.children;
    expect(featuredSection.props.deals).toHaveLength(3);

    const freeGamesSection = children[3].props.children;
    expect(freeGamesSection.props.games).toHaveLength(2);
  });

  it('should render gap-12 spacing between sections', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    expect(element.props.className).toContain('gap-12');
  });

  it('should use revalidate value when calling serverApi.get', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    await HomePage();

    const mockGet = vi.mocked(serverApi.get);
    for (const call of mockGet.mock.calls) {
      expect(call[1]).toBe(900);
    }
  });

  it('should render exactly 8 top-level children', async () => {
    setupMocks();
    const pageModule = await import('../../src/app/page');
    const HomePage = pageModule.default;
    const element = await HomePage();

    const children = element.props.children;
    expect(children).toHaveLength(8);
  });
});
