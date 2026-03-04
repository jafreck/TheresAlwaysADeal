import { describe, it, expect, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => ({
    type: 'a',
    props: { href, ...props, children },
    key: null,
  }),
}));

vi.mock('../../src/components/GameCard', () => ({
  default: (props: Record<string, unknown>) => ({
    type: 'GameCard',
    props,
    key: null,
  }),
}));

vi.mock('../../src/components/EmptyState', () => ({
  default: ({ message }: { message: string }) => ({
    type: 'EmptyState',
    props: { message },
    key: null,
  }),
}));

import FeaturedDealsSection from '../../src/components/FeaturedDealsSection';
import type { FeaturedDeal } from '../../src/components/FeaturedDealsSection';
import EmptyState from '../../src/components/EmptyState';

const makeDeal = (overrides: Partial<FeaturedDeal> = {}): FeaturedDeal => ({
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

describe('FeaturedDealsSection', () => {
  it('should be a function (React component)', () => {
    expect(typeof FeaturedDealsSection).toBe('function');
  });

  it('should return a section element', () => {
    const element = FeaturedDealsSection({ deals: [] });
    expect(element.type).toBe('section');
  });

  it('should render "Featured Deals" heading', () => {
    const element = FeaturedDealsSection({ deals: [] });
    const header = element.props.children[0];
    const heading = header.props.children[0];
    expect(heading.type).toBe('h2');
    expect(heading.props.children).toBe('Featured Deals');
  });

  it('should render "View all deals" link to /deals', () => {
    const element = FeaturedDealsSection({ deals: [] });
    const header = element.props.children[0];
    const link = header.props.children[1];
    expect(link.props.href).toBe('/deals');
    expect(link.props.children).toBe('View all deals');
  });

  it('should render EmptyState when deals array is empty', () => {
    const element = FeaturedDealsSection({ deals: [] });
    const body = element.props.children[1];
    expect(typeof body.type).toBe('function');
    expect(body.props.message).toBe('No featured deals right now. Check back soon!');
  });

  it('should render deal cards when deals are provided', () => {
    const deals = [makeDeal(), makeDeal({ gameSlug: 'half-life-2', gameTitle: 'Half-Life 2' })];
    const element = FeaturedDealsSection({ deals });
    const body = element.props.children[1];
    expect(body.type).toBe('div');
    expect(body.props.children).toHaveLength(2);
  });

  it('should pass correct props to GameCard', () => {
    const deal = makeDeal();
    const element = FeaturedDealsSection({ deals: [deal] });
    const body = element.props.children[1];
    const card = body.props.children[0];
    expect(card.props.gameTitle).toBe('Portal 2');
    expect(card.props.gameSlug).toBe('portal-2');
    expect(card.props.currentPrice).toBe(4.99);
    expect(card.props.originalPrice).toBe(19.99);
    expect(card.props.discount).toBe(75);
    expect(card.props.storeName).toBe('Steam');
    expect(card.props.storeUrl).toBe('https://store.steampowered.com/app/620');
  });

  it('should use gameSlug-storeName as key for each deal card', () => {
    const deals = [
      makeDeal({ gameSlug: 'portal-2', storeName: 'Steam' }),
      makeDeal({ gameSlug: 'portal-2', storeName: 'GOG' }),
    ];
    const element = FeaturedDealsSection({ deals });
    const body = element.props.children[1];
    const cards = body.props.children;
    expect(cards[0].key).toBe('portal-2-Steam');
    expect(cards[1].key).toBe('portal-2-GOG');
  });

  it('should apply snap-scroll classes to the deal container', () => {
    const element = FeaturedDealsSection({ deals: [makeDeal()] });
    const body = element.props.children[1];
    expect(body.props.className).toContain('snap-x');
    expect(body.props.className).toContain('snap-mandatory');
    expect(body.props.className).toContain('overflow-x-auto');
  });

  it('should apply snap-start and min-width classes to each card', () => {
    const element = FeaturedDealsSection({ deals: [makeDeal()] });
    const body = element.props.children[1];
    const card = body.props.children[0];
    expect(card.props.className).toContain('snap-start');
    expect(card.props.className).toContain('min-w-[280px]');
  });

  it('should handle null storeLogoUrl', () => {
    const deal = makeDeal({ storeLogoUrl: null });
    const element = FeaturedDealsSection({ deals: [deal] });
    expect(element.type).toBe('section');
  });

  it('should handle null dealScore', () => {
    const deal = makeDeal({ dealScore: null });
    const element = FeaturedDealsSection({ deals: [deal] });
    expect(element.type).toBe('section');
  });
});
