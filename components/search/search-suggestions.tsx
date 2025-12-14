"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, TrendingUp, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  onClearRecent?: (query: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}

// Popular/trending searches (could be fetched from API in future)
const POPULAR_SEARCHES = [
  "land registration",
  "employment contract",
  "criminal procedure",
  "company incorporation",
  "constitutional rights",
  "marriage act",
  "traffic offenses",
  "tax exemptions",
];

const RECENT_SEARCHES_KEY = "law-lens-recent-searches";
const MAX_RECENT_SEARCHES = 5;

/**
 * Get recent searches from localStorage
 */
function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a search to recent searches
 */
export function saveRecentSearch(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const recent = getRecentSearches();
    // Remove if already exists, add to front
    const filtered = recent.filter(
      (s) => s.toLowerCase() !== query.toLowerCase()
    );
    const updated = [query.trim(), ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Remove a search from recent searches
 */
function removeRecentSearch(query: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter(
      (s) => s.toLowerCase() !== query.toLowerCase()
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}

export function SearchSuggestions({
  query,
  onSelect,
  onClearRecent,
  inputRef,
  className,
}: SearchSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Filter suggestions based on query
  const filteredPopular = query
    ? POPULAR_SEARCHES.filter(
        (s) =>
          s.toLowerCase().includes(query.toLowerCase()) &&
          s.toLowerCase() !== query.toLowerCase()
      )
    : POPULAR_SEARCHES;

  const filteredRecent = query
    ? recentSearches.filter(
        (s) =>
          s.toLowerCase().includes(query.toLowerCase()) &&
          s.toLowerCase() !== query.toLowerCase()
      )
    : recentSearches;

  const allSuggestions = [
    ...filteredRecent.map((s) => ({ type: "recent" as const, value: s })),
    ...filteredPopular
      .filter((s) => !filteredRecent.includes(s))
      .map((s) => ({ type: "popular" as const, value: s })),
  ];

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || allSuggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < allSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : allSuggestions.length - 1
          );
          break;
        case "Enter":
          if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
            e.preventDefault();
            const selected = allSuggestions[selectedIndex];
            onSelect(selected.value);
            setIsOpen(false);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, allSuggestions, selectedIndex, onSelect]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Show dropdown when input is focused
  useEffect(() => {
    const input = inputRef?.current;
    if (!input) return;

    const handleFocus = () => setIsOpen(true);
    const handleBlur = (e: FocusEvent) => {
      // Delay close to allow click on suggestions
      setTimeout(() => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
          setSelectedIndex(-1);
        }
      }, 150);
    };

    input.addEventListener("focus", handleFocus);
    input.addEventListener("blur", handleBlur);

    return () => {
      input.removeEventListener("focus", handleFocus);
      input.removeEventListener("blur", handleBlur);
    };
  }, [inputRef]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const handleClearRecent = (e: React.MouseEvent, searchQuery: string) => {
    e.stopPropagation();
    const updated = removeRecentSearch(searchQuery);
    setRecentSearches(updated);
    onClearRecent?.(searchQuery);
  };

  if (!isOpen || allSuggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute top-full left-0 right-0 z-50 mt-1",
        "rounded-lg border bg-popover shadow-lg",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      role="listbox"
      aria-label="Search suggestions"
    >
      {filteredRecent.length > 0 && (
        <div className="p-2">
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            Recent Searches
          </div>
          {filteredRecent.map((search, index) => (
            <div
              key={`recent-${search}`}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-within:bg-accent focus-within:text-accent-foreground",
                selectedIndex === index && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                onSelect(search);
                setIsOpen(false);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={selectedIndex === index}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(search);
                  setIsOpen(false);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{search}</span>
              </div>
              <button
                className="rounded p-0.5 hover:bg-muted z-10"
                onClick={(e) => handleClearRecent(e, search)}
                aria-label={`Remove ${search} from recent searches`}
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {filteredPopular.filter((s) => !filteredRecent.includes(s)).length > 0 && (
        <>
          {filteredRecent.length > 0 && (
            <div className="border-t" />
          )}
          <div className="p-2">
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Popular Searches
            </div>
            {filteredPopular
              .filter((s) => !filteredRecent.includes(s))
              .slice(0, 5)
              .map((search, index) => {
                const actualIndex = filteredRecent.length + index;
                return (
                  <button
                    key={`popular-${search}`}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                      selectedIndex === actualIndex &&
                        "bg-accent text-accent-foreground"
                    )}
                    onClick={() => {
                      onSelect(search);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(actualIndex)}
                    role="option"
                    aria-selected={selectedIndex === actualIndex}
                  >
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{search}</span>
                  </button>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
