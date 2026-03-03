import { describe, it, expect } from 'vitest';
import { cn } from '../../src/lib/utils';

describe('cn', () => {
  it('should merge multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes via clsx', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('should handle undefined and null inputs', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('should merge conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('should merge conflicting Tailwind color classes', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle object syntax from clsx', () => {
    expect(cn({ 'text-red': true, 'text-blue': false })).toBe('text-red');
  });

  it('should handle array syntax from clsx', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });
});
