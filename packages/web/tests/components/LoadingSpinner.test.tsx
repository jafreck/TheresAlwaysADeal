import { describe, it, expect } from 'vitest';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should be a function (React component)', () => {
    expect(typeof LoadingSpinner).toBe('function');
  });

  it('should render an svg element', () => {
    const element = LoadingSpinner({});
    expect(element.type).toBe('svg');
  });

  it('should have role="status" for accessibility', () => {
    const element = LoadingSpinner({});
    expect(element.props.role).toBe('status');
  });

  it('should have aria-label="Loading"', () => {
    const element = LoadingSpinner({});
    expect(element.props['aria-label']).toBe('Loading');
  });

  it('should default to size 24', () => {
    const element = LoadingSpinner({});
    expect(element.props.width).toBe(24);
    expect(element.props.height).toBe(24);
  });

  it('should accept a custom size', () => {
    const element = LoadingSpinner({ size: 48 });
    expect(element.props.width).toBe(48);
    expect(element.props.height).toBe(48);
  });

  it('should include animate-spin class', () => {
    const element = LoadingSpinner({});
    expect(element.props.className).toContain('animate-spin');
  });

  it('should accept a className prop', () => {
    const element = LoadingSpinner({ className: 'my-spinner' });
    expect(element.props.className).toContain('my-spinner');
  });
});
