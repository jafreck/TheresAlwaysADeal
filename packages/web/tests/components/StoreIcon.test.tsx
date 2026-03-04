import { describe, it, expect } from 'vitest';
import StoreIcon from '../../src/components/StoreIcon';

describe('StoreIcon', () => {
  it('should be a function (React component)', () => {
    expect(typeof StoreIcon).toBe('function');
  });

  it('should render an img element when logoUrl is provided', () => {
    const element = StoreIcon({ storeName: 'Steam', logoUrl: 'https://example.com/steam.png' });
    expect(element.type).toBe('img');
    expect(element.props.src).toBe('https://example.com/steam.png');
    expect(element.props.alt).toBe('Steam logo');
  });

  it('should use default size of 24', () => {
    const element = StoreIcon({ storeName: 'Steam', logoUrl: 'https://example.com/steam.png' });
    expect(element.props.width).toBe(24);
    expect(element.props.height).toBe(24);
  });

  it('should use custom size when provided', () => {
    const element = StoreIcon({ storeName: 'GOG', logoUrl: 'https://example.com/gog.png', size: 48 });
    expect(element.props.width).toBe(48);
    expect(element.props.height).toBe(48);
  });

  it('should render a text fallback when logoUrl is undefined', () => {
    const element = StoreIcon({ storeName: 'Steam' });
    expect(element.type).toBe('span');
    expect(element.props.children).toBe('St');
    expect(element.props['aria-label']).toBe('Steam logo');
  });

  it('should render a text fallback when logoUrl is null', () => {
    const element = StoreIcon({ storeName: 'GOG', logoUrl: null });
    expect(element.type).toBe('span');
    expect(element.props.children).toBe('GO');
  });

  it('should use first 2 characters of storeName as abbreviation', () => {
    const element = StoreIcon({ storeName: 'Epic Games' });
    expect(element.props.children).toBe('Ep');
  });

  it('should handle single-character store names gracefully', () => {
    const element = StoreIcon({ storeName: 'X' });
    expect(element.props.children).toBe('X');
  });

  it('should apply custom className to img element', () => {
    const element = StoreIcon({ storeName: 'Steam', logoUrl: 'https://example.com/steam.png', className: 'custom' });
    expect(element.props.className).toContain('custom');
  });

  it('should apply custom className to fallback span', () => {
    const element = StoreIcon({ storeName: 'Steam', className: 'custom' });
    expect(element.props.className).toContain('custom');
  });

  it('should set inline style with size on fallback span', () => {
    const element = StoreIcon({ storeName: 'GOG', size: 32 });
    expect(element.props.style).toEqual({ width: 32, height: 32 });
  });
});
