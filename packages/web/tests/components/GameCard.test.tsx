import { describe, it, expect, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: function MockImage(props: Record<string, unknown>) {
    return { type: 'img', props, key: null };
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => ({
    type: 'a',
    props: { href, ...props, children },
    key: null,
  }),
}));

import GameCard from '../../src/components/GameCard';

const baseProps = {
  gameTitle: 'Portal 2',
  gameSlug: 'portal-2',
  headerImageUrl: 'https://cdn.example.com/portal2.jpg',
  currentPrice: 4.99,
  originalPrice: 19.99,
  discount: 75,
  storeName: 'Steam',
  storeLogoUrl: 'https://cdn.example.com/steam.png',
  storeUrl: 'https://store.steampowered.com/app/620',
};

describe('GameCard', () => {
  it('should be a function (React component)', () => {
    expect(typeof GameCard).toBe('function');
  });

  it('should return an article element', () => {
    const element = GameCard(baseProps);
    expect(element.type).toBe('article');
  });

  it('should apply custom className', () => {
    const element = GameCard({ ...baseProps, className: 'custom-class' });
    expect(element.props.className).toContain('custom-class');
  });

  it('should include hover shadow style', () => {
    const element = GameCard(baseProps);
    expect(element.props.className).toContain('hover:shadow-md');
  });

  it('should include focus-within ring style', () => {
    const element = GameCard(baseProps);
    expect(element.props.className).toContain('focus-within:ring-2');
  });

  it('should link to the game detail page', () => {
    const element = GameCard(baseProps);
    const link = element.props.children[0];
    expect(link.props.href).toBe('/games/portal-2');
  });

  it('should render a cover image with alt set to game title', () => {
    const element = GameCard(baseProps);
    const link = element.props.children[0];
    const imageContainer = link.props.children[0];
    const image = imageContainer.props.children;
    expect(image.props.alt).toBe('Portal 2');
    expect(image.props.src).toBe('https://cdn.example.com/portal2.jpg');
  });

  it('should set fill on the cover image', () => {
    const element = GameCard(baseProps);
    const link = element.props.children[0];
    const imageContainer = link.props.children[0];
    const image = imageContainer.props.children;
    expect(image.props.fill).toBe(true);
  });

  it('should render the game title in an h3', () => {
    const element = GameCard(baseProps);
    const link = element.props.children[0];
    const content = link.props.children[1];
    const title = content.props.children[0];
    expect(title.type).toBe('h3');
    expect(title.props.children).toBe('Portal 2');
  });

  it('should render store name text', () => {
    const element = GameCard(baseProps);
    const link = element.props.children[0];
    const content = link.props.children[1];
    const storeRow = content.props.children[1];
    const storeLabel = storeRow.props.children[1];
    expect(storeLabel.props.children).toBe('Steam');
  });

  it('should render DiscountBadge when discount > 0', () => {
    const element = GameCard({ ...baseProps, discount: 75 });
    const link = element.props.children[0];
    const content = link.props.children[1];
    const priceRow = content.props.children[2];
    const discountBadge = priceRow.props.children[1];
    expect(discountBadge).toBeTruthy();
  });

  it('should not render DiscountBadge when discount is 0', () => {
    const element = GameCard({ ...baseProps, discount: 0 });
    const link = element.props.children[0];
    const content = link.props.children[1];
    const priceRow = content.props.children[2];
    const discountBadge = priceRow.props.children[1];
    expect(discountBadge).toBeFalsy();
  });

  it('should render BuyButton with correct href', () => {
    const element = GameCard(baseProps);
    const buyWrapper = element.props.children[1];
    const buyButton = buyWrapper.props.children;
    expect(buyButton).toBeDefined();
    expect(buyButton.props.href).toBe('https://store.steampowered.com/app/620');
  });

  it('should pass storeName and gameName to BuyButton', () => {
    const element = GameCard(baseProps);
    const buyWrapper = element.props.children[1];
    const buyButton = buyWrapper.props.children;
    expect(buyButton.props.storeName).toBe('Steam');
    expect(buyButton.props.gameName).toBe('Portal 2');
  });

  it('should handle null storeLogoUrl', () => {
    const element = GameCard({ ...baseProps, storeLogoUrl: null });
    expect(element).toBeDefined();
    expect(element.type).toBe('article');
  });

  it('should handle undefined storeLogoUrl', () => {
    const { storeLogoUrl: _, ...propsWithoutLogo } = baseProps;
    const element = GameCard(propsWithoutLogo as typeof baseProps);
    expect(element).toBeDefined();
    expect(element.type).toBe('article');
  });
});
