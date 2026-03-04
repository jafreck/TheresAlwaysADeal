import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

vi.mock('@radix-ui/react-dialog', () => {
  return {
    Root: ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (v: boolean) => void }) =>
      React.createElement('div', { 'data-testid': 'dialog-root', 'data-open': open, onClick: () => onOpenChange(!open) }, children),
    Trigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
      asChild ? children : React.createElement('button', null, children),
    Portal: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'dialog-portal' }, children),
    Overlay: (props: Record<string, unknown>) =>
      React.createElement('div', { 'data-testid': 'dialog-overlay', ...props }),
    Content: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) =>
      React.createElement('div', { 'data-testid': 'dialog-content', ...props }, children),
    Title: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) =>
      React.createElement('h2', { ...props }, children),
    Close: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
      asChild ? children : React.createElement('button', null, children),
  };
});

import FiltersPanel from '../../src/components/FiltersPanel';
import type { FiltersPanelProps } from '../../src/components/FiltersPanel';

describe('FiltersPanel', () => {
  let defaultProps: FiltersPanelProps;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps = {
      values: {
        store: '',
        min_discount: null,
        max_price: null,
        sort: 'best_match',
      },
      onStoreChange: vi.fn(),
      onMinDiscountChange: vi.fn(),
      onMaxPriceChange: vi.fn(),
      onSortChange: vi.fn(),
    };
  });

  it('should be a function (React component)', () => {
    expect(typeof FiltersPanel).toBe('function');
  });

  it('should render a desktop sidebar with "Filters" heading', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const aside = container.querySelector('aside');
    expect(aside).toBeTruthy();
    const h2 = aside?.querySelector('h2');
    expect(h2?.textContent).toBe('Filters');
  });

  it('should render store checkboxes', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThanOrEqual(5);
  });

  it('should render all five store labels', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const labels = Array.from(container.querySelectorAll('label'));
    const storeNames = ['Steam', 'GOG', 'Epic', 'Humble', 'Fanatical'];
    for (const name of storeNames) {
      expect(labels.some((l) => l.textContent?.includes(name))).toBe(true);
    }
  });

  it('should check store checkbox when store is in values', () => {
    const props = { ...defaultProps, values: { ...defaultProps.values, store: 'Steam,GOG' } };
    const { container } = render(<FiltersPanel {...props} />);
    const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    const steamCheckbox = checkboxes.find((cb) => cb.closest('label')?.textContent?.includes('Steam'));
    const gogCheckbox = checkboxes.find((cb) => cb.closest('label')?.textContent?.includes('GOG'));
    const epicCheckbox = checkboxes.find((cb) => cb.closest('label')?.textContent?.includes('Epic'));
    expect(steamCheckbox?.checked).toBe(true);
    expect(gogCheckbox?.checked).toBe(true);
    expect(epicCheckbox?.checked).toBe(false);
  });

  it('should call onStoreChange when a store checkbox is toggled on', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const labels = Array.from(container.querySelectorAll('label'));
    const steamLabel = labels.find((l) => l.textContent?.includes('Steam'));
    const checkbox = steamLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(defaultProps.onStoreChange).toHaveBeenCalledWith('Steam');
  });

  it('should call onStoreChange to remove a store when unchecked', () => {
    const props = { ...defaultProps, values: { ...defaultProps.values, store: 'Steam,GOG' } };
    const { container } = render(<FiltersPanel {...props} />);
    const labels = Array.from(container.querySelectorAll('label'));
    const steamLabel = labels.find((l) => l.textContent?.includes('Steam'));
    const checkbox = steamLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(defaultProps.onStoreChange).toHaveBeenCalledWith('GOG');
  });

  it('should render discount preset buttons', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    // Desktop sidebar + mobile dialog both render FilterContent, so buttons are doubled
    const aside = container.querySelector('aside')!;
    const buttons = Array.from(aside.querySelectorAll('button'));
    const discountButtons = buttons.filter((b) => b.textContent?.includes('%+'));
    expect(discountButtons.length).toBe(4);
    expect(discountButtons.map((b) => b.textContent)).toEqual(['25%+', '50%+', '75%+', '90%+']);
  });

  it('should call onMinDiscountChange when discount chip is clicked', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const buttons = Array.from(container.querySelectorAll('button'));
    const chip50 = buttons.find((b) => b.textContent === '50%+');
    fireEvent.click(chip50!);
    expect(defaultProps.onMinDiscountChange).toHaveBeenCalledWith(50);
  });

  it('should toggle off discount chip when already selected', () => {
    const props = { ...defaultProps, values: { ...defaultProps.values, min_discount: 50 } };
    const { container } = render(<FiltersPanel {...props} />);
    const buttons = Array.from(container.querySelectorAll('button'));
    const chip50 = buttons.find((b) => b.textContent === '50%+');
    fireEvent.click(chip50!);
    expect(defaultProps.onMinDiscountChange).toHaveBeenCalledWith(null);
  });

  it('should render max price buttons', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const buttons = Array.from(container.querySelectorAll('button'));
    const priceLabels = ['Free only', '$5', '$10', '$20', '$30'];
    for (const label of priceLabels) {
      expect(buttons.some((b) => b.textContent === label)).toBe(true);
    }
  });

  it('should call onMaxPriceChange when max price button is clicked', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const buttons = Array.from(container.querySelectorAll('button'));
    const freeBtn = buttons.find((b) => b.textContent === 'Free only');
    fireEvent.click(freeBtn!);
    expect(defaultProps.onMaxPriceChange).toHaveBeenCalledWith(0);
  });

  it('should toggle off max price when already selected', () => {
    const props = { ...defaultProps, values: { ...defaultProps.values, max_price: 10 } };
    const { container } = render(<FiltersPanel {...props} />);
    const buttons = Array.from(container.querySelectorAll('button'));
    const btn10 = buttons.find((b) => b.textContent === '$10');
    fireEvent.click(btn10!);
    expect(defaultProps.onMaxPriceChange).toHaveBeenCalledWith(null);
  });

  it('should render sort select with default value "best_match"', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.value).toBe('best_match');
  });

  it('should render all sort options', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    // Desktop sidebar + mobile dialog both render FilterContent, so options are doubled
    const aside = container.querySelector('aside')!;
    const options = aside.querySelectorAll('option');
    expect(options.length).toBe(5);
    const values = Array.from(options).map((o) => o.value);
    expect(values).toContain('best_match');
    expect(values).toContain('highest_discount');
    expect(values).toContain('lowest_price');
    expect(values).toContain('a_z');
    expect(values).toContain('release_date');
  });

  it('should call onSortChange when sort selection changes', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'lowest_price' } });
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('lowest_price');
  });

  it('should render mobile Filters trigger button', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const buttons = Array.from(container.querySelectorAll('button'));
    const filtersTrigger = buttons.find((b) => b.textContent === 'Filters');
    expect(filtersTrigger).toBeTruthy();
  });

  it('should render fieldsets for Store, Minimum Discount, Max Price, and Sort By', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const legends = Array.from(container.querySelectorAll('legend'));
    const legendTexts = legends.map((l) => l.textContent);
    expect(legendTexts).toContain('Store');
    expect(legendTexts).toContain('Minimum Discount');
    expect(legendTexts).toContain('Max Price');
    expect(legendTexts).toContain('Sort By');
  });

  it('should call onStoreChange to add a third store', () => {
    const props = { ...defaultProps, values: { ...defaultProps.values, store: 'Steam,GOG' } };
    const { container } = render(<FiltersPanel {...props} />);
    const labels = Array.from(container.querySelectorAll('label'));
    const epicLabel = labels.find((l) => l.textContent?.includes('Epic'));
    const checkbox = epicLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(defaultProps.onStoreChange).toHaveBeenCalledWith('Steam,GOG,Epic');
  });

  it('should render desktop sidebar hidden on mobile', () => {
    const { container } = render(<FiltersPanel {...defaultProps} />);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('hidden');
    expect(aside?.className).toContain('md:block');
  });
});
