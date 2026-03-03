import { describe, it, expect, vi } from 'vitest';
import { ErrorState } from '../../src/components/ErrorState';

describe('ErrorState', () => {
  it('should be a function (React component)', () => {
    expect(typeof ErrorState).toBe('function');
  });

  it('should render the error message', () => {
    const element = ErrorState({ message: 'Something went wrong' });
    const children = element.props.children;
    // children: [svg, p, button?]
    const messageParagraph = children[1];
    expect(messageParagraph.type).toBe('p');
    expect(messageParagraph.props.children).toBe('Something went wrong');
  });

  it('should render an svg warning icon with aria-hidden', () => {
    const element = ErrorState({ message: 'Error' });
    const children = element.props.children;
    const svg = children[0];
    expect(svg.type).toBe('svg');
    expect(svg.props['aria-hidden']).toBe('true');
  });

  it('should render a retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    const element = ErrorState({ message: 'Error', onRetry });
    const children = element.props.children;
    const button = children[2];
    expect(button).toBeDefined();
    expect(button.props.onClick).toBe(onRetry);
    expect(button.props.children).toBe('Try again');
  });

  it('should not render a retry button when onRetry is not provided', () => {
    const element = ErrorState({ message: 'Error' });
    const children = element.props.children;
    expect(children[2]).toBeFalsy();
  });

  it('should accept a className prop', () => {
    const element = ErrorState({ message: 'Error', className: 'my-error' });
    expect(element.props.className).toContain('my-error');
  });
});
