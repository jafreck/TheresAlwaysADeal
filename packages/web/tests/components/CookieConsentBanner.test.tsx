import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

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

import { useConsent } from '@/lib/consent';
import CookieConsentBanner from '../../src/components/CookieConsentBanner';

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    storage.clear();
    useConsent.setState({ consentStatus: 'pending' });
  });

  it('should be a function (React component)', () => {
    expect(typeof CookieConsentBanner).toBe('function');
  });

  it('should render the banner when consent is pending', () => {
    const { container } = render(<CookieConsentBanner />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render banner text about cookies', () => {
    const { container } = render(<CookieConsentBanner />);
    expect(container.textContent).toContain('cookies');
  });

  it('should render an Accept button', () => {
    const { container } = render(<CookieConsentBanner />);
    const buttons = container.querySelectorAll('button');
    const acceptBtn = Array.from(buttons).find((b) => b.textContent === 'Accept');
    expect(acceptBtn).toBeTruthy();
  });

  it('should render a Decline button', () => {
    const { container } = render(<CookieConsentBanner />);
    const buttons = container.querySelectorAll('button');
    const declineBtn = Array.from(buttons).find((b) => b.textContent === 'Decline');
    expect(declineBtn).toBeTruthy();
  });

  it('should render with fixed positioning at the bottom', () => {
    const { container } = render(<CookieConsentBanner />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('fixed');
    expect(div.className).toContain('bottom-0');
  });

  it('should return null when consent is granted', () => {
    useConsent.setState({ consentStatus: 'granted' });
    const { container } = render(<CookieConsentBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null when consent is declined', () => {
    useConsent.setState({ consentStatus: 'declined' });
    const { container } = render(<CookieConsentBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should set consent to granted when Accept is clicked', () => {
    const { container } = render(<CookieConsentBanner />);
    const buttons = container.querySelectorAll('button');
    const acceptBtn = Array.from(buttons).find((b) => b.textContent === 'Accept')!;
    fireEvent.click(acceptBtn);
    expect(useConsent.getState().consentStatus).toBe('granted');
  });

  it('should set consent to declined when Decline is clicked', () => {
    const { container } = render(<CookieConsentBanner />);
    const buttons = container.querySelectorAll('button');
    const declineBtn = Array.from(buttons).find((b) => b.textContent === 'Decline')!;
    fireEvent.click(declineBtn);
    expect(useConsent.getState().consentStatus).toBe('declined');
  });

  it('should hide the banner after Accept is clicked', () => {
    const { container } = render(<CookieConsentBanner />);
    const buttons = container.querySelectorAll('button');
    const acceptBtn = Array.from(buttons).find((b) => b.textContent === 'Accept')!;
    fireEvent.click(acceptBtn);
    expect(container.firstChild).toBeNull();
  });

  it('should hide the banner after Decline is clicked', () => {
    const { container } = render(<CookieConsentBanner />);
    const buttons = container.querySelectorAll('button');
    const declineBtn = Array.from(buttons).find((b) => b.textContent === 'Decline')!;
    fireEvent.click(declineBtn);
    expect(container.firstChild).toBeNull();
  });

  it('should persist granted to localStorage when Accept is clicked', () => {
    const { container } = render(<CookieConsentBanner />);
    const buttons = container.querySelectorAll('button');
    const acceptBtn = Array.from(buttons).find((b) => b.textContent === 'Accept')!;
    fireEvent.click(acceptBtn);
    expect(storage.get('cookie-consent')).toBe('granted');
  });

  it('should persist declined to localStorage when Decline is clicked', () => {
    const { container } = render(<CookieConsentBanner />);
    const buttons = container.querySelectorAll('button');
    const declineBtn = Array.from(buttons).find((b) => b.textContent === 'Decline')!;
    fireEvent.click(declineBtn);
    expect(storage.get('cookie-consent')).toBe('declined');
  });

  it('should have z-50 for high stacking priority', () => {
    const { container } = render(<CookieConsentBanner />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('z-50');
  });
});
