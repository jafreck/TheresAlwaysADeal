import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import robots from '../../src/app/robots';

describe('robots', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it('should be a function', () => {
    expect(typeof robots).toBe('function');
  });

  it('should return rules allowing all user agents', () => {
    const result = robots();
    expect(result.rules).toBeDefined();
    expect(Array.isArray(result.rules)).toBe(true);
    const rules = result.rules as Array<{ userAgent: string; allow: string }>;
    expect(rules[0].userAgent).toBe('*');
    expect(rules[0].allow).toBe('/');
  });

  it('should include a sitemap URL', () => {
    const result = robots();
    expect(result.sitemap).toBeDefined();
    expect(typeof result.sitemap).toBe('string');
    expect((result.sitemap as string).endsWith('/sitemap.xml')).toBe(true);
  });

  it('should use default site URL when env var is not set', () => {
    const result = robots();
    expect(result.sitemap).toContain('theresalwaysadeal.com');
  });
});
