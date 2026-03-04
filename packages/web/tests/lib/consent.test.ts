import { describe, it, expect, beforeEach, vi } from 'vitest';

const { storage } = vi.hoisted(() => {
  const storage = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
    get length() { return storage.size; },
    key: (index: number) => [...storage.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
  return { storage };
});

import { useConsent, getConsentStatus } from '@/lib/consent';

describe('useConsent', () => {
  beforeEach(() => {
    storage.clear();
    useConsent.setState({ consentStatus: 'pending' });
  });

  it('should initialize with pending status when localStorage is empty', () => {
    const state = useConsent.getState();
    expect(state.consentStatus).toBe('pending');
  });

  describe('acceptConsent', () => {
    it('should set consentStatus to granted', () => {
      useConsent.getState().acceptConsent();
      expect(useConsent.getState().consentStatus).toBe('granted');
    });

    it('should persist granted to localStorage', () => {
      useConsent.getState().acceptConsent();
      expect(localStorage.getItem('cookie-consent')).toBe('granted');
    });
  });

  describe('declineConsent', () => {
    it('should set consentStatus to declined', () => {
      useConsent.getState().declineConsent();
      expect(useConsent.getState().consentStatus).toBe('declined');
    });

    it('should persist declined to localStorage', () => {
      useConsent.getState().declineConsent();
      expect(localStorage.getItem('cookie-consent')).toBe('declined');
    });
  });

  it('should allow toggling from granted to declined', () => {
    useConsent.getState().acceptConsent();
    expect(useConsent.getState().consentStatus).toBe('granted');
    useConsent.getState().declineConsent();
    expect(useConsent.getState().consentStatus).toBe('declined');
    expect(localStorage.getItem('cookie-consent')).toBe('declined');
  });

  it('should allow toggling from declined to granted', () => {
    useConsent.getState().declineConsent();
    expect(useConsent.getState().consentStatus).toBe('declined');
    useConsent.getState().acceptConsent();
    expect(useConsent.getState().consentStatus).toBe('granted');
    expect(localStorage.getItem('cookie-consent')).toBe('granted');
  });
});

describe('getConsentStatus', () => {
  beforeEach(() => {
    storage.clear();
    useConsent.setState({ consentStatus: 'pending' });
  });

  it('should return pending when no consent has been given', () => {
    expect(getConsentStatus()).toBe('pending');
  });

  it('should return granted after acceptConsent', () => {
    useConsent.getState().acceptConsent();
    expect(getConsentStatus()).toBe('granted');
  });

  it('should return declined after declineConsent', () => {
    useConsent.getState().declineConsent();
    expect(getConsentStatus()).toBe('declined');
  });
});
