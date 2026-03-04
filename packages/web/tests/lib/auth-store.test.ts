import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, type UserProfile } from '@/lib/auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      userProfile: null,
    });
  });

  it('should initialize with null accessToken and userProfile', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.userProfile).toBeNull();
  });

  describe('setAccessToken', () => {
    it('should set the access token', () => {
      useAuthStore.getState().setAccessToken('test-token-123');
      expect(useAuthStore.getState().accessToken).toBe('test-token-123');
    });

    it('should clear the access token when set to null', () => {
      useAuthStore.getState().setAccessToken('some-token');
      useAuthStore.getState().setAccessToken(null);
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  describe('setUserProfile', () => {
    it('should set the user profile', () => {
      const profile: UserProfile = { id: '1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setUserProfile(profile);
      expect(useAuthStore.getState().userProfile).toEqual(profile);
    });

    it('should handle profile with null name', () => {
      const profile: UserProfile = { id: '2', email: 'anon@example.com', name: null };
      useAuthStore.getState().setUserProfile(profile);
      expect(useAuthStore.getState().userProfile).toEqual(profile);
    });

    it('should clear the user profile when set to null', () => {
      const profile: UserProfile = { id: '1', email: 'test@example.com', name: 'Test' };
      useAuthStore.getState().setUserProfile(profile);
      useAuthStore.getState().setUserProfile(null);
      expect(useAuthStore.getState().userProfile).toBeNull();
    });
  });

  describe('logout', () => {
    it('should reset both accessToken and userProfile to null', () => {
      const profile: UserProfile = { id: '1', email: 'test@example.com', name: 'Test' };
      useAuthStore.getState().setAccessToken('my-token');
      useAuthStore.getState().setUserProfile(profile);

      useAuthStore.getState().logout();

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().userProfile).toBeNull();
    });

    it('should be safe to call when already logged out', () => {
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().userProfile).toBeNull();
    });
  });
});
