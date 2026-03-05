import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { serverApi, ServerApiError } from '../../src/lib/server-api';

describe('ServerApiError', () => {
  it('should create an error with status and statusText', () => {
    const error = new ServerApiError(404, 'Not Found');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ServerApiError');
    expect(error.status).toBe(404);
    expect(error.statusText).toBe('Not Found');
    expect(error.message).toBe('Server API error 404: Not Found');
  });

  it('should extend Error', () => {
    const error = new ServerApiError(500, 'Internal Server Error');
    expect(error).toBeInstanceOf(Error);
    expect(error.stack).toBeDefined();
  });
});

describe('serverApi.get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should make a GET request to the correct URL with base URL fallback', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [1, 2, 3] }),
    });

    const result = await serverApi.get('/items');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/items',
      expect.any(Object),
    );
    expect(result).toEqual({ data: [1, 2, 3] });
  });

  it('should return typed response data', async () => {
    interface Item { id: number; name: string }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: 'Test' }),
    });

    const result = await serverApi.get<Item>('/items/1');
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('should pass revalidate option when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    await serverApi.get('/data', 60);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/data',
      expect.objectContaining({
        next: { revalidate: 60 },
      }),
    );
  });

  it('should not pass next option when revalidate is undefined', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await serverApi.get('/data');

    const options = mockFetch.mock.calls[0][1];
    expect(options.next).toBeUndefined();
  });

  it('should throw ServerApiError on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(serverApi.get('/fail')).rejects.toThrow(ServerApiError);

    try {
      await serverApi.get('/fail');
    } catch (e) {
      const err = e as ServerApiError;
      expect(err.status).toBe(500);
      expect(err.statusText).toBe('Internal Server Error');
    }
  });

  it('should throw ServerApiError on 404 response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(serverApi.get('/missing')).rejects.toThrow(ServerApiError);
    await expect(serverApi.get('/missing')).rejects.toThrow('Server API error 404: Not Found');
  });

  it('should handle revalidate value of 0', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ fresh: true }),
    });

    await serverApi.get('/live', 0);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/live',
      expect.objectContaining({
        next: { revalidate: 0 },
      }),
    );
  });
});

describe('serverApi.getGenres', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return genre array from API response', async () => {
    const genres = [
      { id: 'g1', name: 'Action', slug: 'action' },
      { id: 'g2', name: 'RPG', slug: 'rpg' },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: genres }),
    });

    const result = await serverApi.getGenres();
    expect(result).toEqual(genres);
  });

  it('should call /genres endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await serverApi.getGenres();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/genres',
      expect.any(Object),
    );
  });

  it('should pass revalidate option when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await serverApi.getGenres(3600);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/genres',
      expect.objectContaining({
        next: { revalidate: 3600 },
      }),
    );
  });

  it('should not pass next option when revalidate is undefined', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await serverApi.getGenres();
    const options = mockFetch.mock.calls[0][1];
    expect(options.next).toBeUndefined();
  });

  it('should throw ServerApiError on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(serverApi.getGenres()).rejects.toThrow(ServerApiError);
  });

  it('should return empty array from API when no genres exist', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const result = await serverApi.getGenres();
    expect(result).toEqual([]);
  });
});
