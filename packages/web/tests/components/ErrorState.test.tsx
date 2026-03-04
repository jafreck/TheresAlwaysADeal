import { describe, it, expect, vi } from 'vitest';
import ErrorState from '../../src/components/ErrorState';

describe('ErrorState', () => {
  it('should be a function (React component)', () => {
    expect(typeof ErrorState).toBe('function');
  });

  it('should render a div element', () => {
    const element = ErrorState({ message: 'Something went wrong' });
    expect(element.type).toBe('div');
  });

  it('should display the error message', () => {
    const element = ErrorState({ message: 'Failed to load' });
    const children = element.props.children;
    // children[0] is the <p>, children[1] is the retry button (falsy when not provided)
    const messageP = children[0];
    expect(messageP.type).toBe('p');
    expect(messageP.props.children).toBe('Failed to load');
  });

  it('should not render retry button when onRetry is not provided', () => {
    const element = ErrorState({ message: 'Error' });
    const children = element.props.children;
    expect(children[1]).toBeFalsy();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    const element = ErrorState({ message: 'Error', onRetry });
    const children = element.props.children;
    const button = children[1];
    expect(button).toBeTruthy();
    expect(button.type).toBe('button');
    expect(button.props.children).toBe('Retry');
  });

  it('should attach onClick handler to retry button', () => {
    const onRetry = vi.fn();
    const element = ErrorState({ message: 'Error', onRetry });
    const button = element.props.children[1];
    expect(button.props.onClick).toBe(onRetry);
  });

  it('should have type="button" on retry button', () => {
    const onRetry = vi.fn();
    const element = ErrorState({ message: 'Error', onRetry });
    const button = element.props.children[1];
    expect(button.props.type).toBe('button');
  });

  it('should include focus-visible styles on retry button', () => {
    const onRetry = vi.fn();
    const element = ErrorState({ message: 'Error', onRetry });
    const button = element.props.children[1];
    expect(button.props.className).toContain('focus-visible:outline');
  });

  it('should use danger color styling', () => {
    const element = ErrorState({ message: 'Error' });
    expect(element.props.className).toContain('text-danger');
  });

  it('should accept a custom className', () => {
    const element = ErrorState({ message: 'Error', className: 'custom' });
    expect(element.props.className).toContain('custom');
  });
});
