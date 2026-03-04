import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: function MockImage(props: Record<string, unknown>) {
    return React.createElement('img', props);
  },
}));

import SearchResultsGrid from '../../src/components/SearchResultsGrid';
import type { SearchResultsGridProps } from '../../src/components/SearchResultsGrid';

const baseCard = {
  gameTitle: 'Portal 2',
  gameSlug: 'portal-2',
  headerImageUrl: '/img.jpg',
  currentPrice: 4.99,
  originalPrice: 19.99,
  discount: 75,
  storeName: 'Steam',
  storeLogoUrl: null,
  storeUrl: 'https://store.example.com',
};

const baseProps: SearchResultsGridProps = {
  results: [baseCard],
  total: 1,
  query: 'portal',
  isLoading: false,
};

describe('SearchResultsGrid', () => {
  it('should be a function (React component)', () => {
    expect(typeof SearchResultsGrid).toBe('function');
  });

  it('should render LoadingSpinner when loading with no results', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} results={[]} isLoading={true} />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toBeTruthy();
  });

  it('should render error message when error is provided', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} error="Network error" />);
    expect(container.textContent).toContain('Network error');
  });

  it('should render retry button when error and onRetry provided', () => {
    const onRetry = vi.fn();
    const { container } = render(<SearchResultsGrid {...baseProps} error="Error" onRetry={onRetry} />);
    const retryBtn = container.querySelector('button');
    expect(retryBtn).toBeTruthy();
    expect(retryBtn?.textContent).toBe('Retry');
  });

  it('should render empty state when not loading and no results with query', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} results={[]} query="xyz" />);
    expect(container.textContent).toContain('No results found for "xyz"');
  });

  it('should render empty state with generic message when no query', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} results={[]} query="" />);
    expect(container.textContent).toContain('Try searching');
  });

  it('should render results when data is present', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} />);
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBe(1);
  });

  it('should render result count text', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} total={42} />);
    expect(container.textContent).toContain('42');
    expect(container.textContent).toContain('results');
  });

  it('should show singular "result" for total of 1', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} total={1} />);
    expect(container.textContent).toContain('1 result');
    expect(container.textContent).not.toContain('1 results');
  });

  it('should render multiple GameCards for multiple results', () => {
    const results = [
      { ...baseCard, gameSlug: 'game-1' },
      { ...baseCard, gameSlug: 'game-2' },
    ];
    const { container } = render(<SearchResultsGrid {...baseProps} results={results} total={2} />);
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBe(2);
  });

  it('should render results in a grid container', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
  });

  it('should not render LoadingSpinner when loading but has existing results', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} isLoading={true} results={[baseCard]} />);
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBe(1);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toBeNull();
  });

  it('should show query text in results header', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} query="portal" />);
    expect(container.textContent).toContain('portal');
  });

  it('should prioritize error state over empty state', () => {
    const { container } = render(
      <SearchResultsGrid {...baseProps} results={[]} error="Failed" isLoading={false} />,
    );
    expect(container.textContent).toContain('Failed');
    expect(container.textContent).not.toContain('No results');
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    const { container } = render(<SearchResultsGrid {...baseProps} error="Error" onRetry={onRetry} />);
    const retryBtn = container.querySelector('button');
    fireEvent.click(retryBtn!);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should not render retry button when onRetry is not provided', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} error="Error" />);
    const retryBtn = container.querySelector('button');
    expect(retryBtn).toBeNull();
  });

  it('should format large total with locale string', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} total={1234} />);
    expect(container.textContent).toContain('1,234');
  });

  it('should not show query text in header when query is empty', () => {
    const { container } = render(<SearchResultsGrid {...baseProps} query="" total={5} />);
    expect(container.textContent).toContain('5 results');
    expect(container.textContent).not.toContain('for');
  });
});
