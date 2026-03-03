import { describe, it, expect } from 'vitest';
import { GameCard } from '../../src/components/GameCard';

describe('GameCard', () => {
  const defaultProps = {
    title: 'Elden Ring',
    imageUrl: '/images/elden-ring.jpg',
    currentPrice: 29.99,
    originalPrice: 59.99,
    discount: 50,
    storeName: 'Steam',
    storeUrl: 'https://store.steampowered.com/app/1245620',
  };

  it('should be a function (React component)', () => {
    expect(typeof GameCard).toBe('function');
  });

  it('should render the game title', () => {
    const element = GameCard(defaultProps);
    const contentDiv = element.props.children[1];
    const h3 = contentDiv.props.children[0];
    expect(h3.type).toBe('h3');
    expect(h3.props.children).toBe('Elden Ring');
  });

  it('should render a DiscountBadge when discount is provided and > 0', () => {
    const element = GameCard(defaultProps);
    const contentDiv = element.props.children[1];
    const priceRow = contentDiv.props.children[1];
    const priceRowChildren = priceRow.props.children;
    // First child should be the DiscountBadge (or falsy if no discount)
    const discountBadge = priceRowChildren[0];
    expect(discountBadge).toBeDefined();
  });

  it('should not render a DiscountBadge when discount is 0', () => {
    const element = GameCard({ ...defaultProps, discount: 0 });
    const contentDiv = element.props.children[1];
    const priceRow = contentDiv.props.children[1];
    const discountBadge = priceRow.props.children[0];
    expect(discountBadge).toBeFalsy();
  });

  it('should not render a DiscountBadge when discount is undefined', () => {
    const { discount: _, ...propsWithoutDiscount } = defaultProps;
    const element = GameCard(propsWithoutDiscount);
    const contentDiv = element.props.children[1];
    const priceRow = contentDiv.props.children[1];
    const discountBadge = priceRow.props.children[0];
    expect(discountBadge).toBeFalsy();
  });

  it('should accept a className prop', () => {
    const element = GameCard({ ...defaultProps, className: 'card-custom' });
    expect(element.props.className).toContain('card-custom');
  });

  it('should pass referralUrl to BuyButton', () => {
    const element = GameCard({ ...defaultProps, referralUrl: 'https://ref.example.com' });
    const contentDiv = element.props.children[1];
    const bottomRow = contentDiv.props.children[2];
    const buyButton = bottomRow.props.children[1];
    expect(buyButton.props.referralUrl).toBe('https://ref.example.com');
  });

  it('should render the image with correct alt text', () => {
    const element = GameCard(defaultProps);
    const imageWrapper = element.props.children[0];
    const image = imageWrapper.props.children;
    expect(image.props.alt).toBe('Elden Ring');
    expect(image.props.src).toBe('/images/elden-ring.jpg');
  });
});
