import { describe, it, expect, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: function MockLink({ children, href, ...props }: Record<string, unknown>) {
    return { type: 'a', props: { href, ...props, children }, key: null };
  },
}));

vi.mock('@/lib/query-provider', () => ({
  QueryProvider: function MockQueryProvider({ children }: { children: unknown }) {
    return { type: 'div', props: { 'data-testid': 'query-provider', children }, key: null };
  },
}));

vi.mock('@/components/Header', () => ({
  default: function MockHeader() {
    return { type: 'header', props: { 'data-testid': 'header' }, key: null };
  },
}));

vi.mock('nuqs/adapters/next/app', () => ({
  NuqsAdapter: function MockNuqsAdapter({ children }: { children: unknown }) {
    return { type: 'div', props: { 'data-testid': 'nuqs-adapter', children }, key: null };
  },
}));

import RootLayout from '../../src/app/layout';

type El = { type: string | ((...args: unknown[]) => unknown); props: Record<string, unknown> };

function findElements(
  element: El,
  predicate: (el: El) => boolean,
): El[] {
  let resolved = element;
  // Resolve function components (mocks) to their rendered output
  if (typeof element.type === 'function') {
    resolved = (element.type as (props: Record<string, unknown>) => El)(element.props);
  }
  const results: El[] = [];
  if (predicate(resolved)) results.push(resolved);
  const children = resolved.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === 'object' && 'type' in child) {
        results.push(...findElements(child as El, predicate));
      }
    }
  } else if (children && typeof children === 'object' && 'type' in (children as object)) {
    results.push(
      ...findElements(children as El, predicate),
    );
  }
  return results;
}

describe('RootLayout', () => {
  it('should be a function (React component)', () => {
    expect(typeof RootLayout).toBe('function');
  });

  it('should return an html element', () => {
    const element = RootLayout({ children: 'content' });
    expect(element.type).toBe('html');
  });

  it('should set lang="en" on html element', () => {
    const element = RootLayout({ children: 'content' });
    expect(element.props.lang).toBe('en');
  });

  it('should include a head element with JSON-LD script', () => {
    const element = RootLayout({ children: 'content' });
    const heads = findElements(element, (el) => el.type === 'head');
    expect(heads.length).toBeGreaterThanOrEqual(1);
    const scripts = findElements(heads[0], (el) => el.type === 'script');
    const jsonLdScript = scripts.find((s) => s.props.type === 'application/ld+json');
    expect(jsonLdScript).toBeTruthy();
  });

  it('should contain valid JSON-LD structured data', () => {
    const element = RootLayout({ children: 'content' });
    const heads = findElements(element, (el) => el.type === 'head');
    const scripts = findElements(heads[0], (el) => el.type === 'script');
    const jsonLdScript = scripts.find((s) => s.props.type === 'application/ld+json')!;
    const html = (jsonLdScript.props.dangerouslySetInnerHTML as { __html: string }).__html;
    const data = JSON.parse(html);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('WebSite');
    expect(data.name).toContain('Always a Deal');
  });

  it('should wrap children in QueryProvider', () => {
    const element = RootLayout({ children: 'test-content' });
    const providers = findElements(element, (el) =>
      el.type === 'div' && el.props['data-testid'] === 'query-provider',
    );
    expect(providers.length).toBeGreaterThanOrEqual(1);
  });

  it('should include the Header component', () => {
    const element = RootLayout({ children: 'content' });
    const headers = findElements(element, (el) =>
      el.type === 'header' && el.props['data-testid'] === 'header',
    );
    expect(headers.length).toBeGreaterThanOrEqual(1);
  });

  it('should render children inside a main element', () => {
    const element = RootLayout({ children: 'my-page-content' });
    const mains = findElements(element, (el) => el.type === 'main');
    expect(mains.length).toBe(1);
    expect(mains[0].props.className).toContain('flex-1');
    expect(mains[0].props.children).toBe('my-page-content');
  });

  it('should include ad slot placeholders with data-slot attributes', () => {
    const element = RootLayout({ children: 'content' });
    const slots = findElements(element, (el) =>
      el.type === 'div' && typeof el.props['data-slot'] === 'string',
    );
    expect(slots.length).toBeGreaterThanOrEqual(2);
    const slotNames = slots.map((s) => s.props['data-slot']);
    expect(slotNames).toContain('top-banner');
    expect(slotNames).toContain('footer-banner');
  });

  it('should render a footer element', () => {
    const element = RootLayout({ children: 'content' });
    const footers = findElements(element, (el) => el.type === 'footer');
    expect(footers.length).toBe(1);
  });

  it('should include affiliate disclosure text in footer', () => {
    const element = RootLayout({ children: 'content' });
    const footers = findElements(element, (el) => el.type === 'footer');
    const strongs = findElements(footers[0], (el) => el.type === 'strong');
    const disclosureStrong = strongs.find(
      (s) => s.props.children === 'Affiliate Disclosure:',
    );
    expect(disclosureStrong).toBeTruthy();
  });

  it('should include footer links for Deals, Free Games, and Stores', () => {
    const element = RootLayout({ children: 'content' });
    const footers = findElements(element, (el) => el.type === 'footer');
    const links = findElements(footers[0], (el) => el.type === 'a');
    const hrefs = links.map((l) => l.props.href);
    expect(hrefs).toContain('/deals');
    expect(hrefs).toContain('/free-games');
    expect(hrefs).toContain('/stores');
  });

  it('should include footer links for About Us and Privacy Policy', () => {
    const element = RootLayout({ children: 'content' });
    const footers = findElements(element, (el) => el.type === 'footer');
    const links = findElements(footers[0], (el) => el.type === 'a');
    const hrefs = links.map((l) => l.props.href);
    expect(hrefs).toContain('/about');
    expect(hrefs).toContain('/privacy');
  });

  it('should include focus-visible styles on footer links', () => {
    const element = RootLayout({ children: 'content' });
    const footers = findElements(element, (el) => el.type === 'footer');
    const links = findElements(footers[0], (el) => el.type === 'a');
    for (const link of links) {
      expect(link.props.className).toContain('focus-visible:outline');
    }
  });

  it('should include copyright text in footer', () => {
    const element = RootLayout({ children: 'content' });
    const footers = findElements(element, (el) => el.type === 'footer');
    const paragraphs = findElements(footers[0], (el) => el.type === 'p');
    const copyrightP = paragraphs.find((p) => {
      const children = p.props.children;
      if (Array.isArray(children)) {
        return children.some((c: unknown) => typeof c === 'string' && c.includes('All rights reserved'));
      }
      return typeof children === 'string' && children.includes('All rights reserved');
    });
    expect(copyrightP).toBeTruthy();
  });

  it('should have body with min-h-screen flex layout', () => {
    const element = RootLayout({ children: 'content' });
    const bodies = findElements(element, (el) => el.type === 'body');
    expect(bodies.length).toBe(1);
    expect(bodies[0].props.className).toContain('min-h-screen');
    expect(bodies[0].props.className).toContain('flex');
    expect(bodies[0].props.className).toContain('flex-col');
  });
});
