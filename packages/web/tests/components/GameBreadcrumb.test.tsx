import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement('a', { href, ...props }, children as React.ReactNode),
}));

import GameBreadcrumb from '../../src/components/GameBreadcrumb';

const baseProps = {
  gameTitle: 'Portal 2',
  genreName: 'Puzzle',
  genreSlug: 'puzzle',
};

describe('GameBreadcrumb', () => {
  afterEach(() => cleanup());
  it('should be a function (React component)', () => {
    expect(typeof GameBreadcrumb).toBe('function');
  });

  it('should render a nav element with aria-label Breadcrumb', () => {
    const { container } = render(<GameBreadcrumb {...baseProps} />);
    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb');
  });

  it('should render an ordered list', () => {
    const { container } = render(<GameBreadcrumb {...baseProps} />);
    const ol = container.querySelector('ol');
    expect(ol).toBeTruthy();
  });

  it('should render Home link pointing to /', () => {
    const { getByText } = render(<GameBreadcrumb {...baseProps} />);
    const homeLink = getByText('Home');
    expect(homeLink.tagName).toBe('A');
    expect(homeLink.getAttribute('href')).toBe('/');
  });

  it('should render Genre link pointing to /games?genre=slug', () => {
    const { getByText } = render(<GameBreadcrumb {...baseProps} />);
    const genreLink = getByText('Puzzle');
    expect(genreLink.tagName).toBe('A');
    expect(genreLink.getAttribute('href')).toBe('/games?genre=puzzle');
  });

  it('should render game title as current page (not a link)', () => {
    const { getByText } = render(<GameBreadcrumb {...baseProps} />);
    const titleEl = getByText('Portal 2');
    expect(titleEl.tagName).toBe('LI');
    expect(titleEl.getAttribute('aria-current')).toBe('page');
  });

  it('should not render game title as a link', () => {
    const { container } = render(<GameBreadcrumb {...baseProps} />);
    const links = container.querySelectorAll('a');
    const linkTexts = Array.from(links).map((a) => a.textContent);
    expect(linkTexts).not.toContain('Portal 2');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <GameBreadcrumb {...baseProps} className="custom-class" />,
    );
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('custom-class');
  });

  it('should render separator elements with aria-hidden', () => {
    const { container } = render(<GameBreadcrumb {...baseProps} />);
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(2);
    separators.forEach((sep) => expect(sep.textContent).toBe('/'));
  });

  it('should render exactly 5 list items (3 segments + 2 separators)', () => {
    const { container } = render(<GameBreadcrumb {...baseProps} />);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(5);
  });
});
