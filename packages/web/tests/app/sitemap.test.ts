import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api-client', () => ({
  apiClient: { get: mockGet },
}));

import sitemap from '../../src/app/sitemap';

const mockGames = [
  { id: 1, title: 'Portal 2', slug: 'portal-2', updatedAt: '2024-06-01T00:00:00Z' },
  { id: 2, title: 'Hades', slug: 'hades', updatedAt: '2024-07-15T00:00:00Z' },
];

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a function', () => {
    expect(typeof sitemap).toBe('function');
  });

  it('should return an array', async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 1000, hasNext: false } });
    const result = await sitemap();
    expect(Array.isArray(result)).toBe(true);
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

  it('should have at least one entry', async () => {
    mockGet.mockResolvedValueOnce({ data: [], meta: { total: 0, page: 1, limit: 1000, hasNext: false } });
    const result = await sitemap();
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should include game entries from the API', async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 1000, hasNext: false },
    });
    const result = await sitemap();
    expect(result.length).toBe(3);
    expect(result[1].url).toBe('https://theresalwaysadeal.com/games/portal-2');
    expect(result[2].url).toBe('https://theresalwaysadeal.com/games/hades');
  });

  it('should set game entries with daily changeFrequency and priority 0.8', async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 1000, hasNext: false },
    });
    const result = await sitemap();
    const gameEntry = result[1];
    expect(gameEntry.changeFrequency).toBe('daily');
    expect(gameEntry.priority).toBe(0.8);
  });

  it('should set game entry lastModified from updatedAt', async () => {
    mockGet.mockResolvedValueOnce({
      data: mockGames,
      meta: { total: 2, page: 1, limit: 1000, hasNext: false },
    });
    const result = await sitemap();
    const gameEntry = result[1];
    expect(gameEntry.lastModified).toEqual(new Date('2024-06-01T00:00:00Z'));
  });

  it('should still return homepage when API fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    const result = await sitemap();
    expect(result.length).toBe(1);
    expect(result[0].url).toBe('https://theresalwaysadeal.com');
  });
});
