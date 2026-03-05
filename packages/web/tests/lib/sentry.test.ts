import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockInit = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  init: mockInit,
}));

describe('initSentry', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should call Sentry.init when NEXT_PUBLIC_SENTRY_DSN is set', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://abc@sentry.io/123';
    const { initSentry } = await import('@/lib/sentry');
    initSentry();
    expect(mockInit).toHaveBeenCalledOnce();
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://abc@sentry.io/123',
        tracesSampleRate: 1.0,
      }),
    );
  });

  it('should not call Sentry.init when NEXT_PUBLIC_SENTRY_DSN is absent', async () => {
    const { initSentry } = await import('@/lib/sentry');
    initSentry();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('should pass the current NODE_ENV as environment', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://abc@sentry.io/123';
    process.env.NODE_ENV = 'production';
    const { initSentry } = await import('@/lib/sentry');
    initSentry();
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ environment: 'production' }),
    );
  });

  it('should default environment to "development" when NODE_ENV is undefined', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://abc@sentry.io/123';
    delete process.env.NODE_ENV;
    const { initSentry } = await import('@/lib/sentry');
    initSentry();
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ environment: 'development' }),
    );
  });

  it('should not throw when called multiple times', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://abc@sentry.io/123';
    const { initSentry } = await import('@/lib/sentry');
    expect(() => {
      initSentry();
      initSentry();
    }).not.toThrow();
  });

  it('should export initSentry as a named export', async () => {
    const mod = await import('@/lib/sentry');
    expect(typeof mod.initSentry).toBe('function');
  });
});
