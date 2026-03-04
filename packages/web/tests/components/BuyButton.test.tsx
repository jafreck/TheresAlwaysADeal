import { describe, it, expect } from 'vitest';
import BuyButton from '../../src/components/BuyButton';

describe('BuyButton', () => {
  it('should be a function (React component)', () => {
    expect(typeof BuyButton).toBe('function');
  });

  it('should return an anchor element with the provided href', () => {
    const element = BuyButton({ href: 'https://store.steampowered.com/app/123', storeName: 'Steam' });
    expect(element).toBeDefined();
    expect(element.type).toBe('a');
    expect(element.props.href).toBe('https://store.steampowered.com/app/123');
  });

  it('should open in a new tab with target="_blank"', () => {
    const element = BuyButton({ href: 'https://example.com', storeName: 'Steam' });
    expect(element.props.target).toBe('_blank');
  });

  it('should include rel="noopener noreferrer" for security', () => {
    const element = BuyButton({ href: 'https://example.com', storeName: 'Steam' });
    expect(element.props.rel).toBe('noopener noreferrer');
  });

  it('should handle different store names correctly', () => {
    const stores = ['Steam', 'GOG', 'Epic Games', 'Humble Bundle', 'Fanatical'];
    for (const storeName of stores) {
      const element = BuyButton({ href: 'https://example.com', storeName });
      const children = element.props.children;
      expect(Array.isArray(children) ? children.join('') : children).toBe(`Buy on ${storeName}`);
    }
  });

  it('should have aria-label with store name when gameName is not provided', () => {
    const element = BuyButton({ href: 'https://example.com', storeName: 'Steam' });
    expect(element.props['aria-label']).toBe('Buy on Steam');
  });

  it('should include gameName in aria-label when provided', () => {
    const element = BuyButton({ href: 'https://example.com', storeName: 'Steam', gameName: 'Portal 2' });
    expect(element.props['aria-label']).toBe('Buy Portal 2 on Steam');
  });

  it('should accept a custom className', () => {
    const element = BuyButton({ href: 'https://example.com', storeName: 'Steam', className: 'extra' });
    expect(element.props.className).toContain('extra');
  });

  it('should include focus-visible styles for keyboard accessibility', () => {
    const element = BuyButton({ href: 'https://example.com', storeName: 'Steam' });
    expect(element.props.className).toContain('focus-visible:outline');
  });

  it('should use bg-primary for button-like appearance', () => {
    const element = BuyButton({ href: 'https://example.com', storeName: 'Steam' });
    expect(element.props.className).toContain('bg-primary');
  });
});
