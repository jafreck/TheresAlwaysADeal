import { describe, it, expect, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: function MockImage(props: Record<string, unknown>) {
    return { type: 'img', props, key: null };
  },
}));

import AutocompleteDropdown from '../../src/components/AutocompleteDropdown';
import type { AutocompleteDropdownProps } from '../../src/components/AutocompleteDropdown';

const baseSuggestions = [
  { title: 'Portal 2', slug: 'portal-2' },
  { title: 'Half-Life 2', slug: 'half-life-2' },
  { title: 'Cyberpunk 2077', slug: 'cyberpunk-2077' },
];

const baseProps: AutocompleteDropdownProps = {
  suggestions: baseSuggestions,
  highlightedIndex: -1,
  onSelect: vi.fn(),
  onSeeAll: vi.fn(),
  onClose: vi.fn(),
  isOpen: true,
};

describe('AutocompleteDropdown', () => {
  it('should be a function (React component)', () => {
    expect(typeof AutocompleteDropdown).toBe('function');
  });

  it('should return null when isOpen is false', () => {
    const result = AutocompleteDropdown({ ...baseProps, isOpen: false });
    expect(result).toBeNull();
  });

  it('should return a ul element when isOpen is true', () => {
    const element = AutocompleteDropdown(baseProps);
    expect(element).not.toBeNull();
    expect(element!.type).toBe('ul');
  });

  it('should have role="listbox" on the ul element', () => {
    const element = AutocompleteDropdown(baseProps)!;
    expect(element.props.role).toBe('listbox');
  });

  it('should have id="autocomplete-listbox"', () => {
    const element = AutocompleteDropdown(baseProps)!;
    expect(element.props.id).toBe('autocomplete-listbox');
  });

  it('should render one li per suggestion plus a "See all results" item', () => {
    const element = AutocompleteDropdown(baseProps)!;
    const children = element.props.children;
    // children[0] is the mapped suggestion array, children[1] is the "See all" li
    const suggestionItems = children[0];
    const seeAllItem = children[1];
    expect(suggestionItems).toHaveLength(3);
    expect(seeAllItem.props.children).toBe('See all results');
  });

  it('should render suggestion titles as li text', () => {
    const element = AutocompleteDropdown(baseProps)!;
    const items = element.props.children[0];
    expect(items[0].props.children).toBe('Portal 2');
    expect(items[1].props.children).toBe('Half-Life 2');
    expect(items[2].props.children).toBe('Cyberpunk 2077');
  });

  it('should set role="option" on each suggestion li', () => {
    const element = AutocompleteDropdown(baseProps)!;
    const items = element.props.children[0];
    for (const item of items) {
      expect(item.props.role).toBe('option');
    }
  });

  it('should set aria-selected=true on highlighted suggestion', () => {
    const element = AutocompleteDropdown({ ...baseProps, highlightedIndex: 1 })!;
    const items = element.props.children[0];
    expect(items[0].props['aria-selected']).toBe(false);
    expect(items[1].props['aria-selected']).toBe(true);
    expect(items[2].props['aria-selected']).toBe(false);
  });

  it('should set aria-selected=false on all suggestions when none highlighted', () => {
    const element = AutocompleteDropdown({ ...baseProps, highlightedIndex: -1 })!;
    const items = element.props.children[0];
    for (const item of items) {
      expect(item.props['aria-selected']).toBe(false);
    }
  });

  it('should set aria-selected=true on "See all results" when highlighted', () => {
    const element = AutocompleteDropdown({ ...baseProps, highlightedIndex: 3 })!;
    const seeAll = element.props.children[1];
    expect(seeAll.props['aria-selected']).toBe(true);
  });

  it('should set correct id on each suggestion li', () => {
    const element = AutocompleteDropdown(baseProps)!;
    const items = element.props.children[0];
    expect(items[0].props.id).toBe('autocomplete-option-0');
    expect(items[1].props.id).toBe('autocomplete-option-1');
    expect(items[2].props.id).toBe('autocomplete-option-2');
  });

  it('should set correct id on "See all results" li', () => {
    const element = AutocompleteDropdown(baseProps)!;
    const seeAll = element.props.children[1];
    expect(seeAll.props.id).toBe('autocomplete-option-3');
  });

  it('should use item.slug as key for each suggestion li', () => {
    const element = AutocompleteDropdown(baseProps)!;
    const items = element.props.children[0];
    expect(items[0].key).toBe('portal-2');
    expect(items[1].key).toBe('half-life-2');
    expect(items[2].key).toBe('cyberpunk-2077');
  });

  it('should attach onSelect handler to suggestion onClick', () => {
    const onSelect = vi.fn();
    const element = AutocompleteDropdown({ ...baseProps, onSelect })!;
    const items = element.props.children[0];
    items[1].props.onClick();
    expect(onSelect).toHaveBeenCalledWith('half-life-2');
  });

  it('should attach onSeeAll handler to "See all results" onClick', () => {
    const onSeeAll = vi.fn();
    const element = AutocompleteDropdown({ ...baseProps, onSeeAll })!;
    const seeAll = element.props.children[1];
    seeAll.props.onClick();
    expect(onSeeAll).toHaveBeenCalledOnce();
  });

  it('should prevent default on mouseDown to avoid blur', () => {
    const element = AutocompleteDropdown(baseProps)!;
    const mockEvent = { preventDefault: vi.fn() };
    element.props.onMouseDown(mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalledOnce();
  });

  it('should handle empty suggestions array', () => {
    const element = AutocompleteDropdown({ ...baseProps, suggestions: [] })!;
    const items = element.props.children[0];
    expect(items).toHaveLength(0);
    // "See all results" should still render
    const seeAll = element.props.children[1];
    expect(seeAll.props.children).toBe('See all results');
  });

  it('should highlight "See all results" with index equal to suggestions length', () => {
    const element = AutocompleteDropdown({
      ...baseProps,
      suggestions: [{ title: 'Game', slug: 'game' }],
      highlightedIndex: 1,
    })!;
    const seeAll = element.props.children[1];
    expect(seeAll.props['aria-selected']).toBe(true);
  });
});
