import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import SearchHero from '../../src/components/SearchHero';

describe('SearchHero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should be a function (React component)', () => {
    expect(typeof SearchHero).toBe('function');
  });

  it('should render a section element', () => {
    const { container } = render(<SearchHero />);
    expect(container.querySelector('section')).toBeTruthy();
  });

  it('should render a search input', () => {
    const { container } = render(<SearchHero />);
    const input = container.querySelector('input[type="search"]');
    expect(input).toBeTruthy();
  });

  it('should render CTA tagline text', () => {
    const { container } = render(<SearchHero />);
    expect(container.textContent).toContain('Sign up to track prices and get alerts');
  });

  it('should navigate to search page on form submit with trimmed query', () => {
    const { container } = render(<SearchHero />);
    const input = container.querySelector('input[type="search"]')!;

    fireEvent.change(input, { target: { value: '  Portal 2  ' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockPush).toHaveBeenCalledWith('/search?q=Portal%202');
  });

  it('should not navigate when query is empty', () => {
    const { container } = render(<SearchHero />);
    const input = container.querySelector('input[type="search"]')!;

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should not navigate when query is only whitespace', () => {
    const { container } = render(<SearchHero />);
    const input = container.querySelector('input[type="search"]')!;

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should encode special characters in the query', () => {
    const { container } = render(<SearchHero />);
    const input = container.querySelector('input[type="search"]')!;

    fireEvent.change(input, { target: { value: 'C&C: Generals' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockPush).toHaveBeenCalledWith('/search?q=C%26C%3A%20Generals');
  });
});
