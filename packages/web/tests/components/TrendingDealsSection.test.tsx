import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement('img', props),
}));

vi.mock('../../src/components/GameCard', () => ({
  default: ({ gameTitle, storeName }: { gameTitle: string; storeName: string }) =>
    React.createElement('div', { 'data-testid': 'game-card', 'data-title': gameTitle, 'data-store': storeName }),
}));

vi.mock('../../src/components/EmptyState', () => ({
  default: ({ message }: { message: string }) =>
    React.createElement('div', { 'data-testid': 'empty-state' }, message),
}));

vi.mock('../../src/components/LoadingSpinner', () => ({
  default: ({ size }: { size?: number }) =>
    React.createElement('div', { 'data-testid': 'loading-spinner', 'data-size': size }),
}));

const mockApiGet = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: { get: (...args: unknown[]) => mockApiGet(...args) },
}));

import TrendingDealsSection from '../../src/components/TrendingDealsSection';

const makeDeal = (overrides: Record<string, unknown> = {}) => ({
  gameTitle: 'Portal 2',
  gameSlug: 'portal-2',
  headerImageUrl: 'https://cdn.example.com/portal2.jpg',
  price: 4.99,
  originalPrice: 19.99,
  discount: 75,
  storeName: 'Steam',
  storeLogoUrl: 'https://cdn.example.com/steam.png',
  storeUrl: 'https://store.steampowered.com/app/620',
  dealScore: 9.5,
  ...overrides,
});

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    React.createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

describe('TrendingDealsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should be a function (React component)', () => {
    expect(typeof TrendingDealsSection).toBe('function');
  });

  it('should render a section element', () => {
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [] }),
    );
    expect(container.querySelector('section')).toBeTruthy();
  });

  it('should render "Trending Deals" heading', () => {
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [] }),
    );
    const heading = container.querySelector('h2');
    expect(heading?.textContent).toBe('Trending Deals');
  });

  it('should render four tab buttons', () => {
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [] }),
    );
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(4);
  });

  it('should render tab labels', () => {
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [] }),
    );
    const tabs = container.querySelectorAll('[role="tab"]');
    const labels = Array.from(tabs).map((t) => t.textContent);
    expect(labels).toEqual(['Trending', 'New Deals', 'All-Time Lows', 'Most Discounted']);
  });

  it('should have Trending tab selected initially', () => {
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [makeDeal()] }),
    );
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  it('should render a tablist container', () => {
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [] }),
    );
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();
  });

  it('should render EmptyState when deals array is empty', () => {
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [] }),
    );
    const emptyState = container.querySelector('[data-testid="empty-state"]');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toBe('No deals found for this category.');
  });

  it('should render game cards when deals are provided', () => {
    const deals = [makeDeal(), makeDeal({ gameSlug: 'hl2', gameTitle: 'Half-Life 2' })];
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals }),
    );
    const cards = container.querySelectorAll('[data-testid="game-card"]');
    expect(cards).toHaveLength(2);
  });

  it('should pass correct props to GameCard', () => {
    const deals = [makeDeal()];
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals }),
    );
    const card = container.querySelector('[data-testid="game-card"]');
    expect(card?.getAttribute('data-title')).toBe('Portal 2');
    expect(card?.getAttribute('data-store')).toBe('Steam');
  });

  it('should change active tab on click', () => {
    mockApiGet.mockResolvedValue({ data: [] });
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [makeDeal()] }),
    );
    const tabs = container.querySelectorAll('[role="tab"]');
    fireEvent.click(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
  });

  it('should render grid layout for deal cards', () => {
    const deals = [makeDeal()];
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals }),
    );
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
    expect(grid?.className).toContain('grid-cols-1');
  });

  it('should apply distinct styling to active tab', () => {
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [makeDeal()] }),
    );
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs[0].className).toContain('bg-primary');
    expect(tabs[0].className).toContain('text-white');
    expect(tabs[1].className).toContain('bg-surface');
    expect(tabs[1].className).toContain('text-muted');
  });

  it('should trigger API call when switching to a non-initial tab', async () => {
    mockApiGet.mockResolvedValue({ data: [makeDeal({ gameSlug: 'new-deal' })] });
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [makeDeal()] }),
    );
    const tabs = container.querySelectorAll('[role="tab"]');
    fireEvent.click(tabs[2]); // All-Time Lows
    expect(mockApiGet).toHaveBeenCalled();
  });

  it('should render responsive grid classes', () => {
    const deals = [makeDeal()];
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals }),
    );
    const grid = container.querySelector('.grid');
    expect(grid?.className).toContain('sm:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
    expect(grid?.className).toContain('xl:grid-cols-4');
  });

  it('should update active tab styling when switching tabs', () => {
    mockApiGet.mockResolvedValue({ data: [] });
    const { container } = renderWithQuery(
      React.createElement(TrendingDealsSection, { deals: [makeDeal()] }),
    );
    const tabs = container.querySelectorAll('[role="tab"]');
    fireEvent.click(tabs[3]); // Most Discounted
    expect(tabs[3].className).toContain('bg-primary');
    expect(tabs[3].className).toContain('text-white');
    expect(tabs[0].className).toContain('bg-surface');
  });
});
