import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from '@/lib/auth-store';
import {
  apiClient,
  ApiError,
  type EnvelopeResponse,
  type EnvelopeMeta,
  type SearchGamesParams,
  type AutocompleteParams,
  type AutocompleteItem,
  type AutocompleteResponse,
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

  describe('apiClient.searchGames', () => {
    it('should make a GET request to /api/v1/games/search with query params', async () => {
      const envelope: EnvelopeResponse<unknown> = {
        data: [{ id: 1, title: 'Test Game' }],
        meta: { total: 1, page: 1, limit: 20, hasNext: false },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(envelope),
      });

      const result = await apiClient.searchGames({ q: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/games/search?'),
        expect.objectContaining({ method: 'GET' }),
      );
      const url = mockFetch.mock.calls[0][0] as string;
      const params = new URLSearchParams(url.split('?')[1]);
      expect(params.get('q')).toBe('test');
      expect(result).toEqual(envelope);
    });

    it('should include all optional params in the query string', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: { total: 0, page: 1, limit: 10, hasNext: false } }),
      });

      const searchParams: SearchGamesParams = {
        q: 'rpg',
        page: 2,
        limit: 10,
        store: 'steam',
        genre: 'action',
        min_discount: 50,
        max_price: 20,
      };
      await apiClient.searchGames(searchParams);

      const url = mockFetch.mock.calls[0][0] as string;
      const params = new URLSearchParams(url.split('?')[1]);
      expect(params.get('q')).toBe('rpg');
      expect(params.get('page')).toBe('2');
      expect(params.get('limit')).toBe('10');
      expect(params.get('store')).toBe('steam');
      expect(params.get('genre')).toBe('action');
      expect(params.get('min_discount')).toBe('50');
      expect(params.get('max_price')).toBe('20');
    });

    it('should omit undefined optional params from the query string', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [], meta: { total: 0, page: 1, limit: 20, hasNext: false } }),
      });

      await apiClient.searchGames({ q: 'puzzle' });

      const url = mockFetch.mock.calls[0][0] as string;
      const params = new URLSearchParams(url.split('?')[1]);
      expect(params.get('q')).toBe('puzzle');
      expect(params.has('page')).toBe(false);
      expect(params.has('limit')).toBe(false);
      expect(params.has('store')).toBe(false);
    });

    it('should throw ApiError on non-2xx response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'invalid query' }),
      });

      await expect(apiClient.searchGames({ q: '' })).rejects.toThrow(ApiError);
    });
  });

  describe('apiClient.autocomplete', () => {
    it('should make a GET request to /api/v1/games/autocomplete with query params', async () => {
      const response: AutocompleteResponse = {
        data: [{ title: 'Test Game', slug: 'test-game' }],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(response),
      });

      const result = await apiClient.autocomplete({ q: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/games/autocomplete?'),
        expect.objectContaining({ method: 'GET' }),
      );
      const url = mockFetch.mock.calls[0][0] as string;
      const params = new URLSearchParams(url.split('?')[1]);
      expect(params.get('q')).toBe('test');
      expect(result).toEqual(response);
    });

    it('should include limit param when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await apiClient.autocomplete({ q: 'game', limit: 5 });

      const url = mockFetch.mock.calls[0][0] as string;
      const params = new URLSearchParams(url.split('?')[1]);
      expect(params.get('q')).toBe('game');
      expect(params.get('limit')).toBe('5');
    });

    it('should omit limit param when not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await apiClient.autocomplete({ q: 'game' });

      const url = mockFetch.mock.calls[0][0] as string;
      const params = new URLSearchParams(url.split('?')[1]);
      expect(params.has('limit')).toBe(false);
    });

    it('should throw ApiError on non-2xx response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve(null),
      });

      await expect(apiClient.autocomplete({ q: 'fail' })).rejects.toThrow(ApiError);
    });
  });

  describe('SearchGamesParams type', () => {
    it('should be structurally correct with all fields', () => {
      const params: SearchGamesParams = {
        q: 'test',
        page: 1,
        limit: 20,
        store: 'steam',
        genre: 'action',
        min_discount: 10,
        max_price: 60,
      };
      expect(params.q).toBe('test');
      expect(params.page).toBe(1);
    });
  });

  describe('AutocompleteParams type', () => {
    it('should be structurally correct', () => {
      const params: AutocompleteParams = { q: 'search', limit: 5 };
      expect(params.q).toBe('search');
      expect(params.limit).toBe(5);
    });
  });

  describe('AutocompleteItem type', () => {
    it('should have title and slug', () => {
      const item: AutocompleteItem = { title: 'My Game', slug: 'my-game' };
      expect(item.title).toBe('My Game');
      expect(item.slug).toBe('my-game');
    });
  });

  describe('AutocompleteResponse type', () => {
    it('should contain data array of AutocompleteItems', () => {
      const response: AutocompleteResponse = {
        data: [
          { title: 'Game A', slug: 'game-a' },
          { title: 'Game B', slug: 'game-b' },
        ],
      };
      expect(response.data).toHaveLength(2);
      expect(response.data[0].slug).toBe('game-a');
    });
  });
});
