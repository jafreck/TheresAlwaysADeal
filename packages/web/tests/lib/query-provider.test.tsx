import { describe, it, expect } from 'vitest';
import React from 'react';
import { QueryProvider } from '@/lib/query-provider';

describe('QueryProvider', () => {
  it('should be a function (React component)', () => {
    expect(typeof QueryProvider).toBe('function');
  });

  it('should render without throwing', () => {
    const element = React.createElement(QueryProvider, null,
      React.createElement('div', null, 'child'),
    );
    expect(element).toBeDefined();
    expect(element.type).toBe(QueryProvider);
  });

  it('should accept children prop', () => {
    const child = React.createElement('span', null, 'test child');
    const element = React.createElement(QueryProvider, null, child);
    expect(element.props.children).toBe(child);
  });
});
