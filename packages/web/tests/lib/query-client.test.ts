import { describe, it, expect } from 'vitest';
import { makeQueryClient } from '../../src/lib/query-client';
import { QueryClient } from '@tanstack/react-query';

describe('makeQueryClient', () => {
  it('should return an instance of QueryClient', () => {
    expect(makeQueryClient()).toBeInstanceOf(QueryClient);
  });

  it('should have staleTime set to 60 seconds', () => {
    const defaults = makeQueryClient().getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(60_000);
  });

  it('should have retry set to 1', () => {
    const defaults = makeQueryClient().getDefaultOptions();
    expect(defaults.queries?.retry).toBe(1);
  });

  it('should have refetchOnWindowFocus disabled', () => {
    const defaults = makeQueryClient().getDefaultOptions();
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
  });

  it('should return a new instance each time', () => {
    const a = makeQueryClient();
    const b = makeQueryClient();
    expect(a).not.toBe(b);
  });
});
