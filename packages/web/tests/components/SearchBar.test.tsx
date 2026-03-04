import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

let mockQueryData: { data: Array<{ title: string; slug: string }> } | undefined;

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: mockQueryData, isLoading: false }),
}));

vi.mock('../../src/lib/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  afterEach(() => cleanup());


  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryData = undefined;
  });

  it('should be a function (React component)', () => {
    expect(typeof SearchBar).toBe('function');
  });

  it('should render a search input', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]');
    expect(input).toBeTruthy();
  });

  it('should have placeholder "Search games..."', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]');
    expect(input?.getAttribute('placeholder')).toBe('Search games...');
  });

  it('should have aria-label "Search games"', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]');
    expect(input?.getAttribute('aria-label')).toBe('Search games');
  });

  it('should have role="combobox"', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]');
    expect(input?.getAttribute('role')).toBe('combobox');
  });

  it('should have aria-autocomplete="list"', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]');
    expect(input?.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('should have aria-expanded="false" initially', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]');
    expect(input?.getAttribute('aria-expanded')).toBe('false');
  });

  it('should update input value on change', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'portal' } });
    expect(input.value).toBe('portal');
  });

  it('should navigate to search page on Enter when no dropdown', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'portal' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/search?q=portal');
  });

  it('should not navigate on Enter with empty input', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should encode special characters in search URL', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'game & stuff' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/search?q=game%20%26%20stuff');
  });

  it('should show dropdown when typing 2+ characters with suggestions', () => {
    mockQueryData = { data: [{ title: 'Portal 2', slug: 'portal-2' }] };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'po' } });
    const listbox = container.querySelector('#autocomplete-listbox');
    expect(listbox).toBeTruthy();
  });

  it('should not show dropdown with less than 2 characters', () => {
    mockQueryData = { data: [{ title: 'Portal 2', slug: 'portal-2' }] };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'p' } });
    const listbox = container.querySelector('#autocomplete-listbox');
    expect(listbox).toBeNull();
  });

  it('should close dropdown on Escape', () => {
    mockQueryData = { data: [{ title: 'Portal 2', slug: 'portal-2' }] };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'portal' } });
    expect(container.querySelector('#autocomplete-listbox')).toBeTruthy();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(container.querySelector('#autocomplete-listbox')).toBeNull();
  });

  it('should navigate to game on clicking a suggestion', () => {
    mockQueryData = {
      data: [
        { title: 'Portal 2', slug: 'portal-2' },
        { title: 'Portal Knights', slug: 'portal-knights' },
      ],
    };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'portal' } });
    const options = container.querySelectorAll('#autocomplete-listbox li[role="option"]');
    fireEvent.click(options[0]);
    expect(mockPush).toHaveBeenCalledWith('/games/portal-2');
  });

  it('should navigate to search on clicking "See all results"', () => {
    mockQueryData = { data: [{ title: 'Portal 2', slug: 'portal-2' }] };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'portal' } });
    const options = container.querySelectorAll('#autocomplete-listbox li[role="option"]');
    const seeAll = options[options.length - 1];
    fireEvent.click(seeAll);
    expect(mockPush).toHaveBeenCalledWith('/search?q=portal');
  });

  it('should navigate to game on Enter with ArrowDown highlighted suggestion', () => {
    mockQueryData = {
      data: [
        { title: 'Portal 2', slug: 'portal-2' },
        { title: 'Portal Knights', slug: 'portal-knights' },
      ],
    };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'portal' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/games/portal-2');
  });

  it('should wrap around when pressing ArrowDown past last item', () => {
    mockQueryData = { data: [{ title: 'Game', slug: 'game' }] };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'game' } });
    // Items: 0=Game, 1=See all. ArrowDown 3 times wraps: 0 -> 1 -> 0
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 0
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 1 (See all)
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 0 (wraps)
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/games/game');
  });

  it('should navigate to search on Enter when "See all" is highlighted', () => {
    mockQueryData = { data: [{ title: 'Game', slug: 'game' }] };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'game' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 0
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 1 (See all)
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/search?q=game');
  });

  it('should apply custom className', () => {
    const { container } = render(<SearchBar className="custom-class" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('custom-class');
  });

  it('should set aria-controls to autocomplete-listbox', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]');
    expect(input?.getAttribute('aria-controls')).toBe('autocomplete-listbox');
  });

  it('should ArrowUp from first item to wrap to last item', () => {
    mockQueryData = { data: [{ title: 'Game', slug: 'game' }] };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'game' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // 0
    fireEvent.keyDown(input, { key: 'ArrowUp' }); // wraps to 1 (See all)
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/search?q=game');
  });

  it('should reset highlighted index when typing after keyboard navigation', () => {
    mockQueryData = {
      data: [
        { title: 'Portal 2', slug: 'portal-2' },
        { title: 'Portal Knights', slug: 'portal-knights' },
      ],
    };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'portal' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // highlight index 0
    fireEvent.change(input, { target: { value: 'portal 2' } }); // should reset highlight
    fireEvent.keyDown(input, { key: 'Enter' }); // should go to search, not game
    expect(mockPush).toHaveBeenCalledWith('/search?q=portal%202');
  });

  it('should trim whitespace from search value on navigation', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  portal  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/search?q=portal');
  });

  it('should not navigate when value is only whitespace', () => {
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should clear value and close dropdown after selecting a game', () => {
    mockQueryData = { data: [{ title: 'Portal 2', slug: 'portal-2' }] };
    const { container } = render(<SearchBar />);
    const input = container.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'portal' } });
    const options = container.querySelectorAll('#autocomplete-listbox li[role="option"]');
    fireEvent.click(options[0]);
    expect(input.value).toBe('');
    expect(container.querySelector('#autocomplete-listbox')).toBeNull();
  });
});
