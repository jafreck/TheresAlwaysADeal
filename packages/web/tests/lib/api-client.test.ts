import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from '../../src/lib/auth-store';

describe('apiClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function loadApiClient() {
    // Re-import to pick up mock state
    const mod = await import('../../src/lib/api-client');
    return mod.apiClient;
  }

  it('should make a GET request to the correct URL', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const apiClient = await loadApiClient();
    const result = await apiClient.get<{ data: string }>('/test');

    expect(result).toEqual({ data: 'test' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/test',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('should make a POST request with JSON body', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    const apiClient = await loadApiClient();
    const result = await apiClient.post<{ id: number }>('/items', { name: 'item' });

    expect(result).toEqual({ id: 1 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'item' }),
      }),
    );
  });

  it('should include Authorization header when token is set', async () => {
    useAuthStore.getState().setAuth('my-secret-token', {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const apiClient = await loadApiClient();
    await apiClient.get('/protected');

    const calledHeaders = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(calledHeaders['Authorization']).toBe('Bearer my-secret-token');
  });

  it('should not include Authorization header when no token', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const apiClient = await loadApiClient();
    await apiClient.get('/public');

    const calledHeaders = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(calledHeaders['Authorization']).toBeUndefined();
  });

  it('should set Content-Type to application/json', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const apiClient = await loadApiClient();
    await apiClient.get('/test');

    const calledHeaders = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(calledHeaders['Content-Type']).toBe('application/json');
  });

  it('should throw on non-OK response with status and body', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found'),
    });

    const apiClient = await loadApiClient();
    await expect(apiClient.get('/missing')).rejects.toThrow('404: Not Found');
  });

  it('should throw on 500 server error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    const apiClient = await loadApiClient();
    await expect(apiClient.post('/fail', {})).rejects.toThrow('500: Internal Server Error');
  });
});
