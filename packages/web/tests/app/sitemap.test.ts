import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api-client', () => ({
  apiClient: { get: mockGet },
}));

import sitemap, { revalidate } from '../../src/app/sitemap';

const mockGames = [
  { id: 1, title: 'Portal 2', slug: 'portal-2', updatedAt: '2024-06-01T00:00:00Z' },
  { id: 2, title: 'Hades', slug: 'hades', updatedAt: '2024-07-15T00:00:00Z' },
];

const staticPageUrls = [
  'https://theresalwaysadeal.com',
  'https://theresalwaysadeal.com/deals',
  'https://theresalwaysadeal.com/free-games',
  'https://theresalwaysadeal.com/stores',
  'https://theresalwaysadeal.com/privacy',
  'https://theresalwaysadeal.com/terms',
  'https://theresalwaysadeal.com/affiliate-disclosure',
];

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a function', () => {
    expect(typeof sitemap).toBe('function');
  });

  it('should export revalidate as 3600', () => {
    expect(revalidate).toBe(3600);
  });

  it('should return an array', async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 1000, hasNext: false } });
    const result = await sitemap();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should include all static page entries', async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 1000, hasNext: false } });
    const result = await sitemap();
    const urls = result.map((entry) => entry.url);
    for (const url of staticPageUrls) {
      expect(urls).toContain(url);
    }
  });

  it('should include the homepage entry', async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 1000, hasNext: false } });
    const result = await sitemap();
    const homepage = result.find((entry) => entry.url === 'https://theresalwaysadeal.com');
    expect(homepage).toBeDefined();
  });

  it('should set homepage priority to 1', async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 1000, hasNext: false } });
    const result = await sitemap();
    const homepage = result[0];
    expect(homepage.priority).toBe(1);
  });

  it('should set homepage changeFrequency to daily', async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 1000, hasNext: false } });
    const result = await sitemap();
    const homepage = result[0];
    expect(homepage.changeFrequency).toBe('daily');
  });

  it('should include lastModified as a Date', async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 1000, hasNext: false } });
    const result = await sitemap();
    const homepage = result[0];
    expect(homepage.lastModified).toBeInstanceOf(Date);
  });

  it('should have at least the static page entries', async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 1000, hasNext: false } });
    const result = await sitemap();
    expect(result.length).toBeGreaterThanOrEqual(staticPageUrls.length);
  });

  it('should include game entries from the API', async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 1000, hasNext: false },
    });
    const result = await sitemap();
    expect(result.length).toBe(staticPageUrls.length + 2);
    const urls = result.map((e) => e.url);
    expect(urls).toContain('https://theresalwaysadeal.com/games/portal-2');
    expect(urls).toContain('https://theresalwaysadeal.com/games/hades');
  });

  it('should set game entries with daily changeFrequency and priority 0.8', async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 1000, hasNext: false },
    });
    const result = await sitemap();
    const gameEntry = result.find((e) => e.url?.includes('/games/portal-2'));
    expect(gameEntry?.changeFrequency).toBe('daily');
    expect(gameEntry?.priority).toBe(0.8);
  });

  it('should set game entry lastModified from updatedAt', async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 1000, hasNext: false },
    });
    const result = await sitemap();
    const gameEntry = result.find((e) => e.url?.includes('/games/portal-2'));
    expect(gameEntry?.lastModified).toEqual(new Date('2024-06-01T00:00:00Z'));
  });

  it('should paginate through all API pages', async () => {
    mockGet
      .mockResolvedValueOnce({
        data: [mockGames[0]],
        meta: { total: 2, page: 1, limit: 1, hasNext: true },
      })
      .mockResolvedValueOnce({
        data: [mockGames[1]],
        meta: { total: 2, page: 2, limit: 1, hasNext: false },
      });
    const result = await sitemap();
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenCalledWith('/api/v1/games?limit=1000&page=1');
    expect(mockGet).toHaveBeenCalledWith('/api/v1/games?limit=1000&page=2');
    const urls = result.map((e) => e.url);
    expect(urls).toContain('https://theresalwaysadeal.com/games/portal-2');
    expect(urls).toContain('https://theresalwaysadeal.com/games/hades');
  });

  it('should still return static pages when API fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    const result = await sitemap();
    expect(result.length).toBe(staticPageUrls.length);
    expect(result[0].url).toBe('https://theresalwaysadeal.com');
  });
});
