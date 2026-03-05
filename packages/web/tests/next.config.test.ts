import { describe, it, expect } from 'vitest';
import nextConfig from '../next.config';

describe('nextConfig', () => {
  it('should enable React strict mode', () => {
    expect(nextConfig.reactStrictMode).toBe(true);
  });

  it('should define remote image patterns', () => {
    expect(nextConfig.images?.remotePatterns).toBeDefined();
    expect(Array.isArray(nextConfig.images?.remotePatterns)).toBe(true);
    expect(nextConfig.images!.remotePatterns!.length).toBeGreaterThan(0);
  });

  it('should allow images from expected domains', () => {
    const patterns = nextConfig.images!.remotePatterns!;
    const hostnames = patterns.map((p) => p.hostname);
    expect(hostnames).toContain('**.amazon.com');
    expect(hostnames).toContain('**.bestbuy.com');
    expect(hostnames).toContain('**.walmart.com');
    expect(hostnames).toContain('steamcdn-a.akamaihd.net');
    expect(hostnames).toContain('cdn.akamai.steamstatic.com');
    expect(hostnames).toContain('images.gog-statics.com');
    expect(hostnames).toContain('cdn1.epicgames.com');
  });

  it('should use https protocol for all image patterns', () => {
    const patterns = nextConfig.images!.remotePatterns!;
    for (const pattern of patterns) {
      expect(pattern.protocol).toBe('https');
    }
  });

  it('should export a headers function', () => {
    expect(typeof nextConfig.headers).toBe('function');
  });
});

describe('nextConfig.headers', () => {
  it('should return an array with one route config', async () => {
    const result = await nextConfig.headers!();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('should apply headers to all routes via /(.*) source', async () => {
    const result = await nextConfig.headers!();
    expect(result[0].source).toBe('/(.*)');
  });

  it('should include Content-Security-Policy header', async () => {
    const result = await nextConfig.headers!();
    const headers = result[0].headers;
    const csp = headers.find((h) => h.key === 'Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp!.value).toContain("default-src 'self'");
    expect(csp!.value).toContain("script-src 'self'");
    expect(csp!.value).toContain("style-src 'self'");
  });

  it('should allow Google AdSense domains in CSP', async () => {
    const result = await nextConfig.headers!();
    const headers = result[0].headers;
    const csp = headers.find((h) => h.key === 'Content-Security-Policy');
    expect(csp!.value).toContain('pagead2.googlesyndication.com');
    expect(csp!.value).toContain('adservice.google.com');
  });

  it('should allow unsafe-inline for scripts and styles in CSP', async () => {
    const result = await nextConfig.headers!();
    const headers = result[0].headers;
    const csp = headers.find((h) => h.key === 'Content-Security-Policy');
    expect(csp!.value).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp!.value).toContain("style-src 'self' 'unsafe-inline'");
  });

  it('should include X-Frame-Options set to DENY', async () => {
    const result = await nextConfig.headers!();
    const headers = result[0].headers;
    const xfo = headers.find((h) => h.key === 'X-Frame-Options');
    expect(xfo).toBeDefined();
    expect(xfo!.value).toBe('DENY');
  });

  it('should include X-Content-Type-Options set to nosniff', async () => {
    const result = await nextConfig.headers!();
    const headers = result[0].headers;
    const xcto = headers.find((h) => h.key === 'X-Content-Type-Options');
    expect(xcto).toBeDefined();
    expect(xcto!.value).toBe('nosniff');
  });

  it('should include Referrer-Policy set to strict-origin-when-cross-origin', async () => {
    const result = await nextConfig.headers!();
    const headers = result[0].headers;
    const rp = headers.find((h) => h.key === 'Referrer-Policy');
    expect(rp).toBeDefined();
    expect(rp!.value).toBe('strict-origin-when-cross-origin');
  });

  it('should include Strict-Transport-Security with long max-age', async () => {
    const result = await nextConfig.headers!();
    const headers = result[0].headers;
    const hsts = headers.find((h) => h.key === 'Strict-Transport-Security');
    expect(hsts).toBeDefined();
    expect(hsts!.value).toContain('max-age=63072000');
    expect(hsts!.value).toContain('includeSubDomains');
    expect(hsts!.value).toContain('preload');
  });

  it('should return exactly 5 security headers', async () => {
    const result = await nextConfig.headers!();
    expect(result[0].headers).toHaveLength(5);
  });
});
