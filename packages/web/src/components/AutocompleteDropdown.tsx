"use client";

import type { AutocompleteItem } from "../lib/api-client";

export interface AutocompleteDropdownProps {
  suggestions: AutocompleteItem[];
  highlightedIndex: number;
  onSelect: (slug: string) => void;
  onSeeAll: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function AutocompleteDropdown({
  suggestions,
  highlightedIndex,
  onSelect,
  onSeeAll,
  onClose: _onClose,
  isOpen,
}: AutocompleteDropdownProps) {
  if (!isOpen) return null;

  const seeAllIndex = suggestions.length;

  return (
    <ul
      id="autocomplete-listbox"
      role="listbox"
      className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg"
      onMouseDown={(e) => e.preventDefault()}
    >
      {suggestions.map((item, index) => (
        <li
          key={item.slug}
          id={`autocomplete-option-${index}`}
          role="option"
          aria-selected={index === highlightedIndex}
          className={`cursor-pointer px-4 py-2 text-sm ${
            index === highlightedIndex
              ? "bg-zinc-800 text-zinc-50"
              : "text-zinc-300"
          }`}
          onClick={() => onSelect(item.slug)}
        >
          {item.title}
        </li>
      ))}
      <li
        id={`autocomplete-option-${seeAllIndex}`}
        role="option"
        aria-selected={seeAllIndex === highlightedIndex}
        className={`cursor-pointer border-t border-zinc-700 px-4 py-2 text-sm font-medium ${
          seeAllIndex === highlightedIndex
            ? "bg-zinc-800 text-primary"
            : "text-primary"
        }`}
        onClick={onSeeAll}
      >
        See all results
      </li>
    </ul>
  );
}
