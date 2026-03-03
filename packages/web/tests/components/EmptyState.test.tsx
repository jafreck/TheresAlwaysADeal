import { describe, it, expect } from 'vitest';
import { EmptyState } from '../../src/components/EmptyState';

describe('EmptyState', () => {
  it('should be a function (React component)', () => {
    expect(typeof EmptyState).toBe('function');
  });

  it('should render the title', () => {
    const element = EmptyState({ title: 'No results' });
    const children = element.props.children;
    // children: [svg, h3, description?]
    const h3 = children[1];
    expect(h3.type).toBe('h3');
    expect(h3.props.children).toBe('No results');
  });

  it('should render the description when provided', () => {
    const element = EmptyState({ title: 'No results', description: 'Try again later' });
    const children = element.props.children;
    const description = children[2];
    expect(description).toBeDefined();
    expect(description.type).toBe('p');
    expect(description.props.children).toBe('Try again later');
  });

  it('should not render description when not provided', () => {
    const element = EmptyState({ title: 'No results' });
    const children = element.props.children;
    expect(children[2]).toBeFalsy();
  });

  it('should render an svg icon with aria-hidden', () => {
    const element = EmptyState({ title: 'No results' });
    const children = element.props.children;
    const svg = children[0];
    expect(svg.type).toBe('svg');
    expect(svg.props['aria-hidden']).toBe('true');
  });

  it('should accept a className prop', () => {
    const element = EmptyState({ title: 'No results', className: 'custom' });
    expect(element.props.className).toContain('custom');
  });
});
