import { describe, it, expect } from 'vitest';
import EmptyState from '../../src/components/EmptyState';

describe('EmptyState', () => {
  it('should be a function (React component)', () => {
    expect(typeof EmptyState).toBe('function');
  });

  it('should render a div element', () => {
    const element = EmptyState({ message: 'No results' });
    expect(element.type).toBe('div');
  });

  it('should display the message text', () => {
    const element = EmptyState({ message: 'Nothing here' });
    const children = element.props.children;
    // children[0] is icon (falsy), children[1] is the <p>
    const messageP = children[1];
    expect(messageP.type).toBe('p');
    expect(messageP.props.children).toBe('Nothing here');
  });

  it('should not render icon wrapper when icon is not provided', () => {
    const element = EmptyState({ message: 'Empty' });
    const children = element.props.children;
    expect(children[0]).toBeFalsy();
  });

  it('should render icon when provided', () => {
    const icon = '🔍';
    const element = EmptyState({ message: 'No results', icon });
    const children = element.props.children;
    const iconWrapper = children[0];
    expect(iconWrapper).toBeTruthy();
    expect(iconWrapper.props.children).toBe('🔍');
  });

  it('should accept a custom className', () => {
    const element = EmptyState({ message: 'Empty', className: 'custom' });
    expect(element.props.className).toContain('custom');
  });

  it('should have centered flex layout classes', () => {
    const element = EmptyState({ message: 'Empty' });
    expect(element.props.className).toContain('flex');
    expect(element.props.className).toContain('items-center');
    expect(element.props.className).toContain('justify-center');
  });
});
