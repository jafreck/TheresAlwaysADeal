import { describe, it, expect } from 'vitest';
import { StoreIcon } from '../../src/components/StoreIcon';

describe('StoreIcon', () => {
  it('should be a function (React component)', () => {
    expect(typeof StoreIcon).toBe('function');
  });

  it('should render known store abbreviations', () => {
    const stores: Record<string, string> = {
      Steam: 'ST',
      GOG: 'GOG',
      'Epic Games': 'EG',
      'Humble Bundle': 'HB',
      Fanatical: 'FN',
    };
    for (const [name, abbr] of Object.entries(stores)) {
      const element = StoreIcon({ storeName: name });
      expect(element.props.children).toBe(abbr);
    }
  });

  it('should fall back to first letter for unknown stores', () => {
    const element = StoreIcon({ storeName: 'Amazon' });
    expect(element.props.children).toBe('A');
  });

  it('should use store-specific colors for known stores', () => {
    const element = StoreIcon({ storeName: 'Steam' });
    expect(element.props.className).toContain('bg-[#1b2838]');
  });

  it('should use default colors for unknown stores', () => {
    const element = StoreIcon({ storeName: 'Unknown' });
    expect(element.props.className).toContain('bg-muted');
  });

  it('should default to size 32', () => {
    const element = StoreIcon({ storeName: 'Steam' });
    expect(element.props.style.width).toBe(32);
    expect(element.props.style.height).toBe(32);
  });

  it('should accept a custom size', () => {
    const element = StoreIcon({ storeName: 'Steam', size: 48 });
    expect(element.props.style.width).toBe(48);
    expect(element.props.style.height).toBe(48);
    expect(element.props.style.fontSize).toBeCloseTo(48 * 0.35);
  });

  it('should set title and aria-label to the store name', () => {
    const element = StoreIcon({ storeName: 'GOG' });
    expect(element.props.title).toBe('GOG');
    expect(element.props['aria-label']).toBe('GOG');
  });

  it('should accept a className prop', () => {
    const element = StoreIcon({ storeName: 'Steam', className: 'test-class' });
    expect(element.props.className).toContain('test-class');
  });
});
