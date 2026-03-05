import { describe, it, expect } from 'vitest';
import robots from '../../src/app/robots';

describe('robots', () => {
  it('should be a function', () => {
    expect(typeof robots).toBe('function');
  });

  it('should return an object with rules array', () => {
    const result = robots();
    expect(result.rules).toBeDefined();
    expect(Array.isArray(result.rules)).toBe(true);
  });

  it('should allow all user agents to crawl /', () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const mainRule = rules[0];
    expect(mainRule.userAgent).toBe('*');
    expect(mainRule.allow).toBe('/');
  });

  it('should disallow /api/ and /dashboard', () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const mainRule = rules[0];
    expect(mainRule.disallow).toContain('/api/');
    expect(mainRule.disallow).toContain('/dashboard');
  });

  it('should reference the sitemap URL', () => {
    const result = robots();
    expect(result.sitemap).toBe('https://theresalwaysadeal.com/sitemap.xml');
  });
});
