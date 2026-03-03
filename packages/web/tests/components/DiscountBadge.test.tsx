import { describe, it, expect } from 'vitest';
import { DiscountBadge } from '../../src/components/DiscountBadge';

describe('DiscountBadge', () => {
  it('should be a function (React component)', () => {
    expect(typeof DiscountBadge).toBe('function');
  });

  it('should display the discount percentage', () => {
    const element = DiscountBadge({ discount: 75 });
    expect(element.props.children).toEqual(['-', 75, '%']);
  });

  it('should use green styling for discounts >= 50%', () => {
    const element = DiscountBadge({ discount: 50 });
    expect(element.props.className).toContain('bg-green-600');
    expect(element.props.className).toContain('text-white');
  });

  it('should use green styling for discounts > 50%', () => {
    const element = DiscountBadge({ discount: 80 });
    expect(element.props.className).toContain('bg-green-600');
  });

  it('should use yellow styling for discounts >= 25% and < 50%', () => {
    const element = DiscountBadge({ discount: 25 });
    expect(element.props.className).toContain('bg-yellow-500');
    expect(element.props.className).toContain('text-black');
  });

  it('should use yellow styling for discount of 49%', () => {
    const element = DiscountBadge({ discount: 49 });
    expect(element.props.className).toContain('bg-yellow-500');
  });

  it('should use default styling for discounts < 25%', () => {
    const element = DiscountBadge({ discount: 10 });
    expect(element.props.className).toContain('bg-surface');
    expect(element.props.className).toContain('text-surface-foreground');
  });

  it('should accept a className prop', () => {
    const element = DiscountBadge({ discount: 30, className: 'extra' });
    expect(element.props.className).toContain('extra');
  });

  it('should handle zero discount', () => {
    const element = DiscountBadge({ discount: 0 });
    expect(element.props.children).toEqual(['-', 0, '%']);
    expect(element.props.className).toContain('bg-surface');
  });
});
