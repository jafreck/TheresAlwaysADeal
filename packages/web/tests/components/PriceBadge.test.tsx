import { describe, it, expect } from 'vitest';
import PriceBadge from '../../src/components/PriceBadge';

describe('PriceBadge', () => {
  it('should be a function (React component)', () => {
    expect(typeof PriceBadge).toBe('function');
  });

  it('should render the current price formatted as USD by default', () => {
    const element = PriceBadge({ currentPrice: 9.99 });
    expect(element).toBeDefined();
    expect(element.type).toBe('span');
    // Find the bold price span (second child when no original price)
    const children = element.props.children;
    // children[0] is the original price (falsy), children[1] is the current price span
    const currentSpan = children[1];
    expect(currentSpan.props.children).toBe('$9.99');
  });

  it('should display original price with line-through when different from current', () => {
    const element = PriceBadge({ currentPrice: 4.99, originalPrice: 19.99 });
    const children = element.props.children;
    // children[0] is the original price span (rendered because originalPrice !== currentPrice)
    const originalSpan = children[0];
    expect(originalSpan).toBeTruthy();
    expect(originalSpan.props.className).toContain('line-through');
    expect(originalSpan.props.children).toBe('$19.99');
  });

  it('should not display original price when it equals current price', () => {
    const element = PriceBadge({ currentPrice: 9.99, originalPrice: 9.99 });
    const children = element.props.children;
    // children[0] should be falsy (showOriginal is false)
    expect(children[0]).toBeFalsy();
  });

  it('should not display original price when not provided', () => {
    const element = PriceBadge({ currentPrice: 14.99 });
    const children = element.props.children;
    expect(children[0]).toBeFalsy();
  });

  it('should format prices in a different currency when specified', () => {
    const element = PriceBadge({ currentPrice: 10, currency: 'EUR' });
    const currentSpan = element.props.children[1];
    // Intl.NumberFormat for EUR in en-US renders with €
    expect(currentSpan.props.children).toContain('€');
  });

  it('should accept a custom className', () => {
    const element = PriceBadge({ currentPrice: 5, className: 'my-class' });
    expect(element.props.className).toContain('my-class');
  });

  it('should render current price with font-bold styling', () => {
    const element = PriceBadge({ currentPrice: 0 });
    const currentSpan = element.props.children[1];
    expect(currentSpan.props.className).toContain('font-bold');
  });

  it('should handle a price of zero', () => {
    const element = PriceBadge({ currentPrice: 0 });
    const currentSpan = element.props.children[1];
    expect(currentSpan.props.children).toBe('$0.00');
  });
});
