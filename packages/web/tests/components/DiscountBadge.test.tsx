import { describe, it, expect } from 'vitest';
import DiscountBadge from '../../src/components/DiscountBadge';

describe('DiscountBadge', () => {
  it('should be a function (React component)', () => {
    expect(typeof DiscountBadge).toBe('function');
  });

  it('should display the discount as a negative percentage', () => {
    const element = DiscountBadge({ discount: 75 });
    expect(element.props.children).toEqual(['-', 75, '%']);
  });

  it('should round the discount to the nearest integer', () => {
    const element = DiscountBadge({ discount: 33.7 });
    expect(element.props.children).toEqual(['-', 34, '%']);
  });

  it('should use danger color for discounts >= 50%', () => {
    const element = DiscountBadge({ discount: 50 });
    expect(element.props.className).toContain('text-danger');
    expect(element.props.className).toContain('bg-danger/20');
  });

  it('should use warning color for discounts >= 25% and < 50%', () => {
    const element = DiscountBadge({ discount: 30 });
    expect(element.props.className).toContain('text-warning');
    expect(element.props.className).toContain('bg-warning/20');
  });

  it('should use success color for discounts < 25%', () => {
    const element = DiscountBadge({ discount: 10 });
    expect(element.props.className).toContain('text-success');
    expect(element.props.className).toContain('bg-success/20');
  });

  it('should use warning color at exactly 25%', () => {
    const element = DiscountBadge({ discount: 25 });
    expect(element.props.className).toContain('text-warning');
  });

  it('should accept a custom className', () => {
    const element = DiscountBadge({ discount: 40, className: 'extra' });
    expect(element.props.className).toContain('extra');
  });

  it('should handle a discount of 0', () => {
    const element = DiscountBadge({ discount: 0 });
    expect(element.props.children).toEqual(['-', 0, '%']);
    expect(element.props.className).toContain('text-success');
  });

  it('should handle a discount of 100', () => {
    const element = DiscountBadge({ discount: 100 });
    expect(element.props.children).toEqual(['-', 100, '%']);
    expect(element.props.className).toContain('text-danger');
  });
});
