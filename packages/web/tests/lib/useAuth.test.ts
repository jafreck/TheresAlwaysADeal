import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/lib/auth-store';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/useAuth';

const mockPost = apiClient.post as ReturnType<typeof vi.fn>;
const mockGet = apiClient.get as ReturnType<typeof vi.fn>;

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ accessToken: null, userProfile: null });
  });

  describe('isAuthenticated', () => {
    it('should be false when no access token exists', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should be true when access token exists', () => {
      useAuthStore.setState({ accessToken: 'test-token' });
      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('user', () => {
    it('should be null when no profile is set', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.user).toBeNull();
    });

    it('should return the user profile when set', () => {
      const profile = { id: '1', email: 'test@example.com', name: 'Test' };
      useAuthStore.setState({ userProfile: profile });
      const { result } = renderHook(() => useAuth());
      expect(result.current.user).toEqual(profile);
    });
  });

  describe('login', () => {
    it('should call apiClient.post with credentials and set access token', async () => {
      mockPost.mockResolvedValue({ accessToken: 'new-token' });
      mockGet.mockResolvedValue({ id: '1', email: 'user@example.com', name: null });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('user@example.com', 'password');
      });

      expect(mockPost).toHaveBeenCalledWith('/api/auth/login', {
        email: 'user@example.com',
        password: 'password',
      });
      expect(useAuthStore.getState().accessToken).toBe('new-token');
      expect(mockGet).toHaveBeenCalledWith('/api/auth/me');
      expect(useAuthStore.getState().userProfile).toEqual({ id: '1', email: 'user@example.com', name: null });
    });

    it('should set isLoading to true during login and false after', async () => {
      let resolvePost: (value: unknown) => void;
      mockPost.mockReturnValue(new Promise((res) => { resolvePost = res; }));
      mockGet.mockResolvedValue({ id: '1', email: 'user@example.com', name: null });
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let loginPromise: Promise<void>;
      act(() => {
        loginPromise = result.current.login('user@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePost!({ accessToken: 'tok' });
        await loginPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to false when login fails', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.login('user@example.com', 'password');
        }),
      ).rejects.toThrow('Network error');

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should call apiClient.post with register data and set access token', async () => {
      mockPost.mockResolvedValue({ accessToken: 'reg-token' });
      mockGet.mockResolvedValue({ id: '2', email: 'new@example.com', name: 'New User' });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register({ email: 'new@example.com', password: 'securepass', name: 'New User' });
      });

      expect(mockPost).toHaveBeenCalledWith('/api/auth/register', {
        email: 'new@example.com',
        password: 'securepass',
        name: 'New User',
      });
      expect(useAuthStore.getState().accessToken).toBe('reg-token');
      expect(mockGet).toHaveBeenCalledWith('/api/auth/me');
      expect(useAuthStore.getState().userProfile).toEqual({ id: '2', email: 'new@example.com', name: 'New User' });
    });

    it('should allow registering without a name', async () => {
      mockPost.mockResolvedValue({ accessToken: 'reg-token-2' });
      mockGet.mockResolvedValue({ id: '3', email: 'anon@example.com', name: null });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register({ email: 'anon@example.com', password: 'securepass' });
      });

      expect(mockPost).toHaveBeenCalledWith('/api/auth/register', {
        email: 'anon@example.com',
        password: 'securepass',
      });
    });

    it('should set isLoading to false when register fails', async () => {
      mockPost.mockRejectedValue(new Error('Conflict'));
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.register({ email: 'dup@example.com', password: 'securepass' });
        }),
      ).rejects.toThrow('Conflict');

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call apiClient.post and clear auth state', async () => {
      mockPost.mockResolvedValue({});
      useAuthStore.setState({ accessToken: 'my-token', userProfile: { id: '1', email: 'a@b.com', name: null } });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockPost).toHaveBeenCalledWith('/api/auth/logout');
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().userProfile).toBeNull();
    });

    it('should clear auth state even if apiClient.post fails', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));
      useAuthStore.setState({ accessToken: 'my-token' });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.logout();
        } catch {
          // expected
        }
      });

      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('should set isLoading to false after logout completes', async () => {
      mockPost.mockResolvedValue({});
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
