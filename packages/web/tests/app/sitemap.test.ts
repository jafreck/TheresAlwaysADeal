import { describe, it, expect } from 'vitest';
import sitemap from '../../src/app/sitemap';

describe('sitemap', () => {
  it('should be a function', () => {
    expect(typeof sitemap).toBe('function');
  });

  it('should return an array of sitemap entries', () => {
    const result = sitemap();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include the homepage with priority 1', () => {
    const result = sitemap();
    const homepage = result[0];
    expect(homepage.priority).toBe(1);
  });

  it('should include a lastModified date for the homepage', () => {
    const result = sitemap();
    const homepage = result[0];
    expect(homepage.lastModified).toBeInstanceOf(Date);
  });

  it('should set changeFrequency to daily for the homepage', () => {
    const result = sitemap();
    const homepage = result[0];
    expect(homepage.changeFrequency).toBe('daily');
  });

  it('should use the default site URL in the homepage entry', () => {
    const result = sitemap();
    const homepage = result[0];
    expect(homepage.url).toContain('theresalwaysadeal.com');
  });
});
