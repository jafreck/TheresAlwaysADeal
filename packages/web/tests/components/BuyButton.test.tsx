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
});
