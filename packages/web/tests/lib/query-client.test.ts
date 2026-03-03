import { describe, it, expect } from 'vitest';
import { queryClient } from '../../src/lib/query-client';
import { QueryClient } from '@tanstack/react-query';

describe('queryClient', () => {
  it('should be an instance of QueryClient', () => {
    expect(queryClient).toBeInstanceOf(QueryClient);
  });

  it('should have staleTime set to 60 seconds', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(60_000);
  });

  it('should have retry set to 1', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(1);
  });

  it('should have refetchOnWindowFocus disabled', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
  });
});
