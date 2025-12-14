/**
 * Tests for SearchSuggestions component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchSuggestions, saveRecentSearch } from "@/components/search/search-suggestions";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("SearchSuggestions", () => {
  const mockOnSelect = jest.fn();
  const mockInputRef = { current: document.createElement("input") };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it("should not render when not focused", () => {
    render(
      <SearchSuggestions
        query=""
        onSelect={mockOnSelect}
        inputRef={mockInputRef}
      />
    );

    // Suggestions should not be visible initially
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should show popular searches when input is focused with empty query", () => {
    render(
      <SearchSuggestions
        query=""
        onSelect={mockOnSelect}
        inputRef={mockInputRef}
      />
    );

    // Simulate focus event
    fireEvent.focus(mockInputRef.current);

    // Wait for component to update (may need to wait for state)
    // Popular searches should appear
    expect(screen.queryByText("Popular Searches")).toBeInTheDocument();
  });

  it("should filter suggestions based on query", () => {
    render(
      <SearchSuggestions
        query="land"
        onSelect={mockOnSelect}
        inputRef={mockInputRef}
      />
    );

    fireEvent.focus(mockInputRef.current);

    // Should show "land registration" from popular searches
    expect(screen.queryByText("land registration")).toBeInTheDocument();
    // Should not show unrelated suggestions
    expect(screen.queryByText("criminal procedure")).not.toBeInTheDocument();
  });

  it("should call onSelect when suggestion is clicked", async () => {
    const user = userEvent.setup();

    render(
      <SearchSuggestions
        query=""
        onSelect={mockOnSelect}
        inputRef={mockInputRef}
      />
    );

    fireEvent.focus(mockInputRef.current);

    // Find and click a suggestion
    const suggestion = screen.getByText("land registration");
    await user.click(suggestion);

    expect(mockOnSelect).toHaveBeenCalledWith("land registration");
  });

  it("should show recent searches when available", () => {
    // Save a recent search first
    saveRecentSearch("my previous search");

    render(
      <SearchSuggestions
        query=""
        onSelect={mockOnSelect}
        inputRef={mockInputRef}
      />
    );

    fireEvent.focus(mockInputRef.current);

    expect(screen.queryByText("Recent Searches")).toBeInTheDocument();
    expect(screen.queryByText("my previous search")).toBeInTheDocument();
  });
});

describe("saveRecentSearch", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("should save a search to localStorage", () => {
    saveRecentSearch("test search");

    const stored = JSON.parse(
      localStorageMock.getItem("law-lens-recent-searches") || "[]"
    );
    expect(stored).toContain("test search");
  });

  it("should not save empty searches", () => {
    saveRecentSearch("");
    saveRecentSearch("   ");

    const stored = localStorageMock.getItem("law-lens-recent-searches");
    expect(stored).toBeNull();
  });

  it("should limit recent searches to 5", () => {
    for (let i = 1; i <= 7; i++) {
      saveRecentSearch(`search ${i}`);
    }

    const stored = JSON.parse(
      localStorageMock.getItem("law-lens-recent-searches") || "[]"
    );
    expect(stored.length).toBe(5);
    // Most recent should be first
    expect(stored[0]).toBe("search 7");
  });

  it("should move duplicate to front instead of adding again", () => {
    saveRecentSearch("first");
    saveRecentSearch("second");
    saveRecentSearch("first"); // Duplicate

    const stored = JSON.parse(
      localStorageMock.getItem("law-lens-recent-searches") || "[]"
    );
    expect(stored.length).toBe(2);
    expect(stored[0]).toBe("first"); // Should be at front
  });

  it("should trim whitespace from searches", () => {
    saveRecentSearch("  trimmed search  ");

    const stored = JSON.parse(
      localStorageMock.getItem("law-lens-recent-searches") || "[]"
    );
    expect(stored[0]).toBe("trimmed search");
  });
});
