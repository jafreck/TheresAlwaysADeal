import { describe, it, expect } from 'vitest';
import { PriceBadge } from '../../src/components/PriceBadge';

describe('PriceBadge', () => {
  it('should be a function (React component)', () => {
    expect(typeof PriceBadge).toBe('function');
  });

  it('should render the current price formatted as currency', () => {
    const element = PriceBadge({ currentPrice: 9.99 });
    const container = element.props.children;
    const priceSpan = container[0];
    expect(priceSpan.props.children).toBe('$9.99');
  });

  it('should format price with two decimal places', () => {
    const element = PriceBadge({ currentPrice: 10 });
    const container = element.props.children;
    const priceSpan = container[0];
    expect(priceSpan.props.children).toBe('$10.00');
  });

  it('should show original price with line-through when different from current price', () => {
    const element = PriceBadge({ currentPrice: 4.99, originalPrice: 19.99 });
    const container = element.props.children;
    const originalSpan = container[1];
    expect(originalSpan).toBeDefined();
    expect(originalSpan.props.children).toBe('$19.99');
    expect(originalSpan.props.className).toContain('line-through');
  });

  it('should not show original price when it equals current price', () => {
    const element = PriceBadge({ currentPrice: 9.99, originalPrice: 9.99 });
    const container = element.props.children;
    expect(container[1]).toBeFalsy();
  });

  it('should not show original price when not provided', () => {
    const element = PriceBadge({ currentPrice: 9.99 });
    const container = element.props.children;
    expect(container[1]).toBeFalsy();
  });

  it('should accept a className prop', () => {
    const element = PriceBadge({ currentPrice: 9.99, className: 'custom-class' });
    expect(element.props.className).toContain('custom-class');
  });

  it('should handle zero price', () => {
    const element = PriceBadge({ currentPrice: 0 });
    const container = element.props.children;
    const priceSpan = container[0];
    expect(priceSpan.props.children).toBe('$0.00');
  });
});
