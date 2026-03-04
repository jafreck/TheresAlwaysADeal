import { describe, it, expect } from 'vitest';
import sitemap from '../../src/app/sitemap';

describe('sitemap', () => {
  it('should be a function', () => {
    expect(typeof sitemap).toBe('function');
  });

  it('should return an array', () => {
    const result = sitemap();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should include the homepage entry', () => {
    const result = sitemap();
    const homepage = result.find((entry) => entry.url === 'https://theresalwaysadeal.com');
    expect(homepage).toBeDefined();
  });

  it('should set homepage priority to 1', () => {
    const result = sitemap();
    const homepage = result[0];
    expect(homepage.priority).toBe(1);
  });

  it('should set homepage changeFrequency to daily', () => {
    const result = sitemap();
    const homepage = result[0];
    expect(homepage.changeFrequency).toBe('daily');
  });

  it('should include lastModified as a Date', () => {
    const result = sitemap();
    const homepage = result[0];
    expect(homepage.lastModified).toBeInstanceOf(Date);
  });

  it('should have at least one entry', () => {
    const result = sitemap();
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
