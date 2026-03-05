import { describe, it, expect, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => ({
    type: 'a',
    props: { href, ...props, children },
    key: null,
  }),
}));

import GenreBrowseSection from '../../src/components/GenreBrowseSection';

describe('GenreBrowseSection', () => {
  it('should be a function (React component)', () => {
    expect(typeof GenreBrowseSection).toBe('function');
  });

  it('should return a section element', () => {
    const element = GenreBrowseSection();
    expect(element.type).toBe('section');
  });

  it('should render "Browse by Genre" heading', () => {
    const element = GenreBrowseSection();
    const heading = element.props.children[0];
    expect(heading.type).toBe('h2');
    expect(heading.props.children).toBe('Browse by Genre');
  });

  it('should render 10 genre links', () => {
    const element = GenreBrowseSection();
    const container = element.props.children[1];
    expect(container.props.children).toHaveLength(10);
  });

  it('should render genre links with correct href pattern', () => {
    const element = GenreBrowseSection();
    const container = element.props.children[1];
    const links = container.props.children;
    expect(links[0].props.href).toBe('/games/genre/action');
    expect(links[1].props.href).toBe('/games/genre/rpg');
    expect(links[2].props.href).toBe('/games/genre/strategy');
  });

  it('should render genre names as link text', () => {
    const element = GenreBrowseSection();
    const container = element.props.children[1];
    const links = container.props.children;
    expect(links[0].props.children).toBe('Action');
    expect(links[1].props.children).toBe('RPG');
    expect(links[2].props.children).toBe('Strategy');
    expect(links[3].props.children).toBe('Adventure');
    expect(links[4].props.children).toBe('Simulation');
  });

  it('should include all expected genres', () => {
    const element = GenreBrowseSection();
    const container = element.props.children[1];
    const links = container.props.children;
    const names = links.map((l: { props: { children: string } }) => l.props.children);
    expect(names).toEqual([
      'Action', 'RPG', 'Strategy', 'Adventure', 'Simulation',
      'Sports', 'Puzzle', 'Racing', 'Horror', 'Indie',
    ]);
  });

  it('should use slug as key for each genre link', () => {
    const element = GenreBrowseSection();
    const container = element.props.children[1];
    const links = container.props.children;
    expect(links[0].key).toBe('action');
    expect(links[1].key).toBe('rpg');
  });

  it('should apply flex-wrap classes to the genre container', () => {
    const element = GenreBrowseSection();
    const container = element.props.children[1];
    expect(container.props.className).toContain('flex');
    expect(container.props.className).toContain('flex-wrap');
  });

  it('should apply hover and focus-visible styles to genre links', () => {
    const element = GenreBrowseSection();
    const container = element.props.children[1];
    const firstLink = container.props.children[0];
    expect(firstLink.props.className).toContain('hover:bg-primary');
    expect(firstLink.props.className).toContain('focus-visible:outline');
  });

  it('should apply rounded-full class to genre chips', () => {
    const element = GenreBrowseSection();
    const container = element.props.children[1];
    const firstLink = container.props.children[0];
    expect(firstLink.props.className).toContain('rounded-full');
  });
});
