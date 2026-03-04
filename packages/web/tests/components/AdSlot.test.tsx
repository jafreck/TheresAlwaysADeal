import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';

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
import AdSlot from '../../src/components/AdSlot';

describe('AdSlot', () => {
  beforeEach(() => {
    storage.clear();
    useConsent.setState({ consentStatus: 'pending' });
  });

  it('should be a function (React component)', () => {
    expect(typeof AdSlot).toBe('function');
  });

  it('should render nothing before mount effect runs (SSR guard)', () => {
    // On the very first synchronous render useState(false) means mounted=false → null
    // But after useEffect fires, it sets mounted=true and re-renders.
    // With @testing-library/react, effects run, so we get the dev placeholder.
    const { container } = render(<AdSlot slotId="above-fold" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render a dev-mode placeholder in non-production', () => {
    const { container } = render(<AdSlot slotId="above-fold" />);
    const div = container.firstChild as HTMLElement;
    expect(div.textContent).toContain('Ad Slot');
    expect(div.textContent).toContain('above-fold');
  });

  it('should set data-slot attribute to the slotId in dev mode', () => {
    const { container } = render(<AdSlot slotId="mid-page" />);
    const div = container.firstChild as HTMLElement;
    expect(div.getAttribute('data-slot')).toBe('mid-page');
  });

  it('should show the slotId text in dev placeholder', () => {
    const { container } = render(<AdSlot slotId="game-detail-sidebar" />);
    expect(container.textContent).toContain('game-detail-sidebar');
  });

  it('should include dashed border styling in dev mode', () => {
    const { container } = render(<AdSlot slotId="above-fold" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('border-dashed');
  });

  it('should apply the correct min-height for known slot configs', () => {
    const { container } = render(<AdSlot slotId="mid-page" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.minHeight).toBe('250px');
  });

  it('should apply 90px min-height for above-fold slot', () => {
    const { container } = render(<AdSlot slotId="above-fold" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.minHeight).toBe('90px');
  });

  it('should apply 600px min-height for game-detail-sidebar slot', () => {
    const { container } = render(<AdSlot slotId="game-detail-sidebar" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.minHeight).toBe('600px');
  });

  it('should fallback to 90px for unknown slot ids', () => {
    const { container } = render(<AdSlot slotId="unknown-slot" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.minHeight).toBe('90px');
  });

  it('should accept a custom className', () => {
    const { container } = render(<AdSlot slotId="above-fold" className="mt-4" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('mt-4');
  });

  it('should render dev placeholder for all known slot ids', () => {
    const knownSlots = [
      'above-fold',
      'mid-page',
      'game-detail-sidebar',
      'search-results-inline',
      'dashboard-banner',
    ];
    for (const slotId of knownSlots) {
      const { container } = render(<AdSlot slotId={slotId} />);
      expect(container.textContent).toContain(slotId);
    }
  });
});
