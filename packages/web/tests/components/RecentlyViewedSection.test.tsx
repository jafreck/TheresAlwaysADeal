import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement('img', props),
}));

vi.mock('../../src/components/GameCard', () => ({
  default: ({ gameTitle, storeName }: { gameTitle: string; storeName: string }) =>
    React.createElement('div', { 'data-testid': 'game-card', 'data-title': gameTitle, 'data-store': storeName }),
}));

import RecentlyViewedSection from '../../src/components/RecentlyViewedSection';

const makeGame = (overrides: Record<string, unknown> = {}) => ({
  gameTitle: 'Portal 2',
  gameSlug: 'portal-2',
  headerImageUrl: 'https://cdn.example.com/portal2.jpg',
  currentPrice: 4.99,
  originalPrice: 19.99,
  discount: 75,
  storeName: 'Steam',
  storeLogoUrl: 'https://cdn.example.com/steam.png',
  storeUrl: 'https://store.steampowered.com/app/620',
  ...overrides,
});

const STORAGE_KEY = 'recently-viewed-games';

const mockGetItem = vi.fn<(key: string) => string | null>().mockReturnValue(null);
const mockSetItem = vi.fn();
const mockRemoveItem = vi.fn();

const mockLocalStorage = {
  getItem: mockGetItem,
  setItem: mockSetItem,
  removeItem: mockRemoveItem,
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

describe('RecentlyViewedSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetItem.mockReturnValue(null);
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('should be a function (React component)', () => {
    expect(typeof RecentlyViewedSection).toBe('function');
  });

  it('should return null when localStorage is empty', () => {
    const { container } = render(React.createElement(RecentlyViewedSection));
    expect(container.innerHTML).toBe('');
  });

  it('should return null when localStorage has empty array', () => {
    mockGetItem.mockReturnValue(JSON.stringify([]));
    const { container } = render(React.createElement(RecentlyViewedSection));
    expect(container.innerHTML).toBe('');
  });

  it('should render section when games exist in localStorage', async () => {
    const games = [makeGame()];
    mockGetItem.mockReturnValue(JSON.stringify(games));
    let container: HTMLElement;
    await act(async () => {
      const result = render(React.createElement(RecentlyViewedSection));
      container = result.container;
    });
    expect(container!.querySelector('section')).toBeTruthy();
  });

  it('should render "Recently Viewed" heading', async () => {
    mockGetItem.mockReturnValue(JSON.stringify([makeGame()]));
    let container: HTMLElement;
    await act(async () => {
      const result = render(React.createElement(RecentlyViewedSection));
      container = result.container;
    });
    const heading = container!.querySelector('h2');
    expect(heading?.textContent).toBe('Recently Viewed');
  });

  it('should render game cards from localStorage', async () => {
    const games = [
      makeGame({ gameSlug: 'portal-2' }),
      makeGame({ gameSlug: 'half-life-2', gameTitle: 'Half-Life 2' }),
    ];
    mockGetItem.mockReturnValue(JSON.stringify(games));
    let container: HTMLElement;
    await act(async () => {
      const result = render(React.createElement(RecentlyViewedSection));
      container = result.container;
    });
    const cards = container!.querySelectorAll('[data-testid="game-card"]');
    expect(cards).toHaveLength(2);
  });

  it('should limit games to 10 items', async () => {
    const games = Array.from({ length: 15 }, (_, i) =>
      makeGame({ gameSlug: `game-${i}`, gameTitle: `Game ${i}` }),
    );
    mockGetItem.mockReturnValue(JSON.stringify(games));
    let container: HTMLElement;
    await act(async () => {
      const result = render(React.createElement(RecentlyViewedSection));
      container = result.container;
    });
    const cards = container!.querySelectorAll('[data-testid="game-card"]');
    expect(cards).toHaveLength(10);
  });

  it('should pass correct props to GameCard', async () => {
    mockGetItem.mockReturnValue(JSON.stringify([makeGame()]));
    let container: HTMLElement;
    await act(async () => {
      const result = render(React.createElement(RecentlyViewedSection));
      container = result.container;
    });
    const card = container!.querySelector('[data-testid="game-card"]');
    expect(card?.getAttribute('data-title')).toBe('Portal 2');
    expect(card?.getAttribute('data-store')).toBe('Steam');
  });

  it('should handle corrupt localStorage data gracefully', () => {
    mockGetItem.mockReturnValue('not-valid-json{{{');
    const { container } = render(React.createElement(RecentlyViewedSection));
    expect(container.innerHTML).toBe('');
  });

  it('should apply snap-scroll classes to the container', async () => {
    mockGetItem.mockReturnValue(JSON.stringify([makeGame()]));
    let container: HTMLElement;
    await act(async () => {
      const result = render(React.createElement(RecentlyViewedSection));
      container = result.container;
    });
    const scrollContainer = container!.querySelector('.overflow-x-auto');
    expect(scrollContainer).toBeTruthy();
    expect(scrollContainer?.className).toContain('snap-x');
    expect(scrollContainer?.className).toContain('snap-mandatory');
  });
});
