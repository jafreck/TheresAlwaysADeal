import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from '@/lib/auth-store';
import {
  apiClient,
  ApiError,
  type EnvelopeResponse,
  type EnvelopeMeta,
  type GameDetail,
  type StoreListing,
  type PriceStats,
  type PriceHistoryEntry,
  type WishlistResponse,
  type PriceAlertResponse,
} from '@/lib/api-client';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('api-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ accessToken: null, userProfile: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ApiError', () => {
    it('should create an error with status, statusText, and body', () => {
      const error = new ApiError(404, 'Not Found', { message: 'missing' });
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ApiError');
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.body).toEqual({ message: 'missing' });
      expect(error.message).toBe('API error 404: Not Found');
    });
  });

  describe('EnvelopeResponse type', () => {
    it('should be structurally correct', () => {
      const response: EnvelopeResponse<{ id: number }> = {
        data: [{ id: 1 }, { id: 2 }],
        meta: { total: 2, page: 1, limit: 10, hasNext: false },
      };
      expect(response.data).toHaveLength(2);
      expect(response.meta.total).toBe(2);
    });
  });

  describe('EnvelopeMeta type', () => {
    it('should have the expected shape', () => {
      const meta: EnvelopeMeta = { total: 100, page: 3, limit: 25, hasNext: true };
      expect(meta.total).toBe(100);
      expect(meta.page).toBe(3);
      expect(meta.limit).toBe(25);
      expect(meta.hasNext).toBe(true);
    });
  });

  describe('request headers', () => {
    it('should include Content-Type application/json', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should include Authorization header when token is set', async () => {
      useAuthStore.getState().setAccessToken('bearer-token-123');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: true }),
      });

      await apiClient.get('/protected');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer bearer-token-123',
          }),
        }),
      );
    });

    it('should not include Authorization header when no token is set', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/public');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe('apiClient.get', () => {
    it('should make a GET request to the correct URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      const result = await apiClient.get('/items/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/items/1',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual({ id: 1 });
    });

    it('should not include a body for GET requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/items');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: undefined }),
      );
    });
  });

  describe('apiClient.post', () => {
    it('should make a POST request with JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 2 }),
      });

      const result = await apiClient.post('/items', { name: 'new item' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'new item' }),
        }),
      );
      expect(result).toEqual({ id: 2 });
    });

    it('should allow POST without a body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      await apiClient.post('/actions/trigger');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST', body: undefined }),
      );
    });
  });

  describe('apiClient.put', () => {
    it('should make a PUT request with JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ updated: true }),
      });

      await apiClient.put('/items/1', { name: 'updated' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/items/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'updated' }),
        }),
      );
    });
  });

  describe('apiClient.delete', () => {
    it('should make a DELETE request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ deleted: true }),
      });

      await apiClient.delete('/items/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/items/1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('error handling', () => {
    it('should throw ApiError for non-2xx responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: () => Promise.resolve({ errors: ['invalid field'] }),
      });

      await expect(apiClient.post('/items', {})).rejects.toThrow(ApiError);

      try {
        await apiClient.post('/items', {});
      } catch (e) {
        const err = e as ApiError;
        expect(err.status).toBe(422);
        expect(err.statusText).toBe('Unprocessable Entity');
        expect(err.body).toEqual({ errors: ['invalid field'] });
      }
    });

    it('should handle responses where error body is not valid JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('not json')),
      });

      await expect(apiClient.get('/fail')).rejects.toThrow(ApiError);

      try {
        await apiClient.get('/fail');
      } catch (e) {
        const err = e as ApiError;
        expect(err.status).toBe(500);
        expect(err.body).toBeNull();
      }
    });
  });

  describe('type exports', () => {
    it('GameDetail interface should be structurally correct', () => {
      const detail: GameDetail = {
        id: 1,
        title: 'Test Game',
        slug: 'test-game',
        description: 'A test game',
        headerImageUrl: 'https://example.com/img.jpg',
        steamAppId: '12345',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        storeListings: [],
        priceStats: [],
      };
      expect(detail.title).toBe('Test Game');
      expect(detail.storeListings).toEqual([]);
      expect(detail.priceStats).toEqual([]);
    });

    it('StoreListing interface should be structurally correct', () => {
      const listing: StoreListing = {
        id: 1,
        storeId: 2,
        storeName: 'Steam',
        storeSlug: 'steam',
        storeUrl: 'https://store.steampowered.com/app/123',
        isActive: true,
        isAllTimeLow: false,
      };
      expect(listing.storeName).toBe('Steam');
    });

    it('PriceStats interface should be structurally correct', () => {
      const stats: PriceStats = {
        id: 1,
        storeListingId: 1,
        currentPrice: '9.99',
        lowestPrice: '4.99',
        highestPrice: '19.99',
        averagePrice: '12.49',
        lastCheckedAt: '2024-01-01T00:00:00Z',
      };
      expect(stats.currentPrice).toBe('9.99');
    });

    it('PriceHistoryEntry interface should be structurally correct', () => {
      const entry: PriceHistoryEntry = {
        id: 1,
        storeListingId: 1,
        price: '9.99',
        originalPrice: '19.99',
        currency: 'USD',
        discount: 50,
        saleEndsAt: null,
        recordedAt: '2024-01-01T00:00:00Z',
      };
      expect(entry.discount).toBe(50);
    });

    it('WishlistResponse interface should be structurally correct', () => {
      const wishlist: WishlistResponse = {
        id: 1,
        gameId: 1,
        userId: 1,
        createdAt: '2024-01-01T00:00:00Z',
      };
      expect(wishlist.gameId).toBe(1);
    });

    it('PriceAlertResponse interface should be structurally correct', () => {
      const alert: PriceAlertResponse = {
        id: 1,
        gameId: 1,
        userId: 1,
        targetPrice: '9.99',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };
      expect(alert.isActive).toBe(true);
    });
  });

  describe('apiClient.getGameBySlug', () => {
    it('should make a GET request to /api/v1/games/:slug', async () => {
      const gameData = { data: { id: 1, title: 'Portal 2', slug: 'portal-2' } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(gameData),
      });

      const result = await apiClient.getGameBySlug('portal-2');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/games/portal-2',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(gameData);
    });

    it('should throw ApiError when game is not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Game not found' }),
      });

      await expect(apiClient.getGameBySlug('nonexistent')).rejects.toThrow(ApiError);

      try {
        await apiClient.getGameBySlug('nonexistent');
      } catch (e) {
        const err = e as ApiError;
        expect(err.status).toBe(404);
      }
    });
  });

  describe('apiClient.getPriceHistory', () => {
    it('should make a GET request to /api/v1/games/:slug/price-history', async () => {
      const historyData = { data: [{ id: 1, price: '9.99' }] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(historyData),
      });

      const result = await apiClient.getPriceHistory('portal-2');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/games/portal-2/price-history',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(historyData);
    });

    it('should include store query parameter when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await apiClient.getPriceHistory('portal-2', 'steam');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/games/portal-2/price-history?store=steam',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should encode special characters in store parameter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await apiClient.getPriceHistory('portal-2', 'GOG & Epic');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/games/portal-2/price-history?store=GOG%20%26%20Epic',
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  describe('apiClient.toggleWishlist', () => {
    it('should make a POST request to /api/v1/wishlists with gameId', async () => {
      const wishlistData = { data: { id: 1, gameId: 42, userId: 1 } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(wishlistData),
      });

      const result = await apiClient.toggleWishlist(42);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/wishlists',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ gameId: 42 }),
        }),
      );
      expect(result).toEqual(wishlistData);
    });

    it('should throw ApiError when not authenticated', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Not authenticated' }),
      });

      await expect(apiClient.toggleWishlist(42)).rejects.toThrow(ApiError);

      try {
        await apiClient.toggleWishlist(42);
      } catch (e) {
        const err = e as ApiError;
        expect(err.status).toBe(401);
      }
    });
  });

  describe('apiClient.createPriceAlert', () => {
    it('should make a POST request to /api/v1/price-alerts with gameId and targetPrice', async () => {
      const alertData = { data: { id: 1, gameId: 42, targetPrice: '9.99' } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(alertData),
      });

      const result = await apiClient.createPriceAlert(42, 9.99);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/price-alerts',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ gameId: 42, targetPrice: 9.99 }),
        }),
      );
      expect(result).toEqual(alertData);
    });

    it('should throw ApiError on validation error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: () => Promise.resolve({ errors: ['targetPrice must be positive'] }),
      });

      await expect(apiClient.createPriceAlert(42, -1)).rejects.toThrow(ApiError);

      try {
        await apiClient.createPriceAlert(42, -1);
      } catch (e) {
        const err = e as ApiError;
        expect(err.status).toBe(422);
        expect(err.body).toEqual({ errors: ['targetPrice must be positive'] });
      }
    });
  });

  describe('new method type contracts', () => {
    it('GameDetail should support nullable fields', () => {
      const detail: GameDetail = {
        id: 1,
        title: 'Test Game',
        slug: 'test-game',
        description: null,
        headerImageUrl: null,
        steamAppId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        storeListings: [],
        priceStats: [],
      };
      expect(detail.description).toBeNull();
      expect(detail.headerImageUrl).toBeNull();
      expect(detail.steamAppId).toBeNull();
    });

    it('PriceHistoryEntry should support nullable saleEndsAt', () => {
      const entry: PriceHistoryEntry = {
        id: 1,
        storeListingId: 1,
        price: '9.99',
        originalPrice: '19.99',
        currency: 'USD',
        discount: 50,
        saleEndsAt: '2025-12-31T00:00:00Z',
        recordedAt: '2024-01-01T00:00:00Z',
      };
      expect(entry.saleEndsAt).toBe('2025-12-31T00:00:00Z');
    });
  });
});
