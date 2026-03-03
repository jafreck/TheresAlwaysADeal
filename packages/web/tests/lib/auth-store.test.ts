import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/lib/auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('should have null initial accessToken', () => {
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('should have null initial user', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('should set auth with setAuth', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    useAuthStore.getState().setAuth('my-token', user);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('my-token');
    expect(state.user).toEqual(user);
  });

  it('should clear auth with clearAuth', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    useAuthStore.getState().setAuth('my-token', user);
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('should handle user with null name', () => {
    const user = { id: '2', email: 'noname@example.com', name: null };
    useAuthStore.getState().setAuth('token-2', user);

    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('should overwrite previous auth on subsequent setAuth calls', () => {
    const user1 = { id: '1', email: 'a@a.com', name: 'A' };
    const user2 = { id: '2', email: 'b@b.com', name: 'B' };

    useAuthStore.getState().setAuth('token-1', user1);
    useAuthStore.getState().setAuth('token-2', user2);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('token-2');
    expect(state.user).toEqual(user2);
  });
});
