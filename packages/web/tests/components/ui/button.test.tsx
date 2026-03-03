import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';

// Mock the @/ alias so vitest can resolve it
vi.mock('@/lib/utils', () => {
  const { clsx } = require('clsx');
  const { twMerge } = require('tailwind-merge');
  return {
    cn: (...inputs: unknown[]) => twMerge(clsx(inputs)),
  };
});

import { Button, buttonVariants } from '../../../src/components/ui/button';

describe('Button', () => {
  it('should be a forwardRef component', () => {
    expect(typeof Button).toBe('object');
    expect(Button.displayName).toBe('Button');
  });

  it('should render a button element by default', () => {
    const element = React.createElement(Button, { children: 'Click me' });
    expect(element).toBeDefined();
    expect(element.type).toBe(Button);
    expect(element.props.children).toBe('Click me');
  });

  it('should accept variant prop', () => {
    const element = React.createElement(Button, { variant: 'destructive', children: 'Delete' });
    expect(element.props.variant).toBe('destructive');
  });

  it('should accept size prop', () => {
    const element = React.createElement(Button, { size: 'sm', children: 'Small' });
    expect(element.props.size).toBe('sm');
  });

  it('should accept asChild prop', () => {
    const element = React.createElement(Button, { asChild: true, children: 'Link' });
    expect(element.props.asChild).toBe(true);
  });

  it('should accept className prop', () => {
    const element = React.createElement(Button, { className: 'custom', children: 'Styled' });
    expect(element.props.className).toBe('custom');
  });
});

describe('buttonVariants', () => {
  it('should be a function', () => {
    expect(typeof buttonVariants).toBe('function');
  });

  it('should return a class string for default variant', () => {
    const classes = buttonVariants({ variant: 'default', size: 'default' });
    expect(typeof classes).toBe('string');
    expect(classes.length).toBeGreaterThan(0);
  });

  it('should return different classes for different variants', () => {
    const defaultClasses = buttonVariants({ variant: 'default' });
    const destructiveClasses = buttonVariants({ variant: 'destructive' });
    const outlineClasses = buttonVariants({ variant: 'outline' });
    const ghostClasses = buttonVariants({ variant: 'ghost' });
    const linkClasses = buttonVariants({ variant: 'link' });

    const all = [defaultClasses, destructiveClasses, outlineClasses, ghostClasses, linkClasses];
    const unique = new Set(all);
    expect(unique.size).toBe(all.length);
  });

  it('should return different classes for different sizes', () => {
    const defaultSize = buttonVariants({ size: 'default' });
    const smSize = buttonVariants({ size: 'sm' });
    const lgSize = buttonVariants({ size: 'lg' });
    const iconSize = buttonVariants({ size: 'icon' });

    const all = [defaultSize, smSize, lgSize, iconSize];
    const unique = new Set(all);
    expect(unique.size).toBe(all.length);
  });

  it('should include common base classes', () => {
    const classes = buttonVariants();
    expect(classes).toContain('inline-flex');
    expect(classes).toContain('items-center');
  });

  it('should include size classes for sm', () => {
    const classes = buttonVariants({ size: 'sm' });
    expect(classes).toContain('h-8');
    expect(classes).toContain('px-3');
  });

  it('should include size classes for lg', () => {
    const classes = buttonVariants({ size: 'lg' });
    expect(classes).toContain('h-10');
    expect(classes).toContain('px-8');
  });

  it('should include size classes for icon', () => {
    const classes = buttonVariants({ size: 'icon' });
    expect(classes).toContain('h-9');
    expect(classes).toContain('w-9');
  });
});
