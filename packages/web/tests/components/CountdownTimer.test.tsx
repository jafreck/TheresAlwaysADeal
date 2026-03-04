import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import CountdownTimer from '../../src/components/CountdownTimer';

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should be a function (React component)', () => {
    expect(typeof CountdownTimer).toBe('function');
  });

  it('should show "Expired" when expiresAt is in the past', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const { container } = render(
      <CountdownTimer expiresAt="2025-01-01T00:00:00Z" />,
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(container.textContent).toBe('Expired');
  });

  it('should display countdown when expiresAt is in the future', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const { container } = render(
      <CountdownTimer expiresAt="2025-06-02T01:02:03Z" />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const text = container.textContent ?? '';
    expect(text).toContain('d');
    expect(text).toContain('h');
    expect(text).toContain('m');
    expect(text).toContain('s');
  });

  it('should update countdown each second', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const { container } = render(
      <CountdownTimer expiresAt="2025-06-01T00:05:00Z" />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const initialText = container.textContent;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const updatedText = container.textContent;
    expect(updatedText).not.toBe(initialText);
  });

  it('should transition to "Expired" when countdown reaches zero', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));

    const { container } = render(
      <CountdownTimer expiresAt="2025-06-01T00:00:02Z" />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(container.textContent).not.toBe('Expired');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(container.textContent).toBe('Expired');
  });

  it('should clean up interval on unmount', () => {
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(
      <CountdownTimer expiresAt="2025-06-02T00:00:00Z" />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
