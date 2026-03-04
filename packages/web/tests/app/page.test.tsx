import { describe, it, expect, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: function MockLink({ children, href, ...props }: Record<string, unknown>) {
    return { type: 'a', props: { href, ...props, children }, key: null };
  },
}));

import HomePage from '../../src/app/page';

describe('HomePage', () => {
  it('should be a function (React component)', () => {
    expect(typeof HomePage).toBe('function');
  });

  it('should return a div element', () => {
    const element = HomePage();
    expect(element.type).toBe('div');
  });

  it('should render a hero section', () => {
    const element = HomePage();
    const children = element.props.children;
    const heroSection = children[0];
    expect(heroSection.type).toBe('section');
  });

  it('should render the site title in an h1', () => {
    const element = HomePage();
    const heroSection = element.props.children[0];
    const h1 = heroSection.props.children[0];
    expect(h1.type).toBe('h1');
    expect(h1.props.children).toContain('Always a Deal');
  });

  it('should render a tagline paragraph', () => {
    const element = HomePage();
    const heroSection = element.props.children[0];
    const tagline = heroSection.props.children[1];
    expect(tagline.type).toBe('p');
    expect(tagline.props.children).toContain('best deals');
  });

  it('should render CTA buttons for Browse Deals and Free Games', () => {
    const element = HomePage();
    const heroSection = element.props.children[0];
    const ctaContainer = heroSection.props.children[2];
    const links = ctaContainer.props.children;
    expect(links).toHaveLength(2);

    const browseDeals = links[0];
    expect(browseDeals.type).toBe('a');
    expect(browseDeals.props.href).toBe('/deals');
    expect(browseDeals.props.children).toBe('Browse Deals');

    const freeGames = links[1];
    expect(freeGames.type).toBe('a');
    expect(freeGames.props.href).toBe('/free-games');
    expect(freeGames.props.children).toBe('Free Games');
  });

  it('should render a Featured Deals section', () => {
    const element = HomePage();
    const featuredSection = element.props.children[1];
    expect(featuredSection.type).toBe('section');
  });

  it('should render Featured Deals heading as h2', () => {
    const element = HomePage();
    const featuredSection = element.props.children[1];
    const h2 = featuredSection.props.children[0];
    expect(h2.type).toBe('h2');
    expect(h2.props.children).toBe('Featured Deals');
  });

  it('should use EmptyState component in Featured Deals section', () => {
    const element = HomePage();
    const featuredSection = element.props.children[1];
    const emptyState = featuredSection.props.children[1];
    expect(emptyState).toBeTruthy();
    expect(emptyState.props.message).toContain('No featured deals yet');
  });

  it('should pass an icon to EmptyState', () => {
    const element = HomePage();
    const featuredSection = element.props.children[1];
    const emptyState = featuredSection.props.children[1];
    expect(emptyState.props.icon).toBeTruthy();
  });

  it('should have responsive text classes on the title', () => {
    const element = HomePage();
    const heroSection = element.props.children[0];
    const h1 = heroSection.props.children[0];
    expect(h1.props.className).toContain('text-4xl');
    expect(h1.props.className).toContain('md:text-5xl');
  });

  it('should have responsive padding on the hero section', () => {
    const element = HomePage();
    const heroSection = element.props.children[0];
    expect(heroSection.props.className).toContain('py-20');
    expect(heroSection.props.className).toContain('md:py-32');
  });

  it('should have focus-visible styles on CTA links', () => {
    const element = HomePage();
    const heroSection = element.props.children[0];
    const ctaContainer = heroSection.props.children[2];
    const links = ctaContainer.props.children;
    for (const link of links) {
      expect(link.props.className).toContain('focus-visible:outline');
    }
  });

  it('should have primary background on Browse Deals button', () => {
    const element = HomePage();
    const heroSection = element.props.children[0];
    const ctaContainer = heroSection.props.children[2];
    const browseDeals = ctaContainer.props.children[0];
    expect(browseDeals.props.className).toContain('bg-primary');
  });
});
