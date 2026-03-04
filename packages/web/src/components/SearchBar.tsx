/* eslint-disable no-undef */
"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "../lib/useDebounce";
import { apiClient } from "../lib/api-client";
import { cn } from "../lib/utils";
import AutocompleteDropdown from "./AutocompleteDropdown";

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const debouncedValue = useDebounce(value, 200);

  const { data } = useQuery({
    queryKey: ["autocomplete", debouncedValue],
    queryFn: () => apiClient.autocomplete({ q: debouncedValue }),
    enabled: debouncedValue.length >= 2,
  });

  const suggestions = data?.data?.slice(0, 5) ?? [];
  const totalItems = suggestions.length + 1; // +1 for "See all results"

  const navigateToSearch = useCallback(() => {
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
      setIsOpen(false);
    }
  }, [value, router]);

  const navigateToGame = useCallback(
    (slug: string) => {
      router.push(`/games/${slug}`);
      setIsOpen(false);
      setValue("");
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        navigateToSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : totalItems - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          navigateToGame(suggestions[highlightedIndex].slug);
        } else if (highlightedIndex === suggestions.length) {
          navigateToSearch();
        } else {
          navigateToSearch();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setHighlightedIndex(-1);
    if (e.target.value.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && suggestions.length > 0;
  const activeDescendant =
    highlightedIndex >= 0 ? `autocomplete-option-${highlightedIndex}` : undefined;

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search games..."
        aria-label="Search games"
        aria-expanded={showDropdown}
        aria-controls="autocomplete-listbox"
        aria-activedescendant={activeDescendant}
        role="combobox"
        aria-autocomplete="list"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />
      <AutocompleteDropdown
        suggestions={suggestions}
        highlightedIndex={highlightedIndex}
        onSelect={navigateToGame}
        onSeeAll={navigateToSearch}
        onClose={() => {
          setIsOpen(false);
          setHighlightedIndex(-1);
        }}
        isOpen={showDropdown}
      />
    </div>
  );
}
