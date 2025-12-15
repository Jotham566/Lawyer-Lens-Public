"use client";

import * as React from "react";
import type { ChatSource } from "@/lib/api/types";

type ViewMode = "panel" | "modal" | "hover";

interface CitationContextValue {
  // Active citation state
  activeSource: ChatSource | null;
  activeCitationNumber: number | null;
  setActiveSource: (source: ChatSource | null, number?: number) => void;

  // All sources in current message
  allSources: ChatSource[];
  setAllSources: (sources: ChatSource[]) => void;

  // Panel state
  isPanelOpen: boolean;
  openPanel: (source: ChatSource, number: number) => void;
  closePanel: () => void;

  // Navigation
  currentIndex: number;
  goToNext: () => void;
  goToPrevious: () => void;
  goToIndex: (index: number) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;

  // View preferences
  preferredView: ViewMode;
  setPreferredView: (view: ViewMode) => void;

  // Mobile detection
  isMobile: boolean;
}

const CitationContext = React.createContext<CitationContextValue | null>(null);

interface CitationProviderProps {
  children: React.ReactNode;
}

export function CitationProvider({ children }: CitationProviderProps) {
  // State
  const [activeSource, setActiveSourceState] = React.useState<ChatSource | null>(null);
  const [activeCitationNumber, setActiveCitationNumber] = React.useState<number | null>(null);
  const [allSources, setAllSources] = React.useState<ChatSource[]>([]);
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [preferredView, setPreferredView] = React.useState<ViewMode>("panel");

  // Mobile detection
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Setters
  const setActiveSource = React.useCallback((source: ChatSource | null, number?: number) => {
    setActiveSourceState(source);
    setActiveCitationNumber(number ?? null);
    if (source && number && allSources.length > 0) {
      // Find index in allSources (1-indexed citation number to 0-indexed array)
      const idx = number - 1;
      if (idx >= 0 && idx < allSources.length) {
        setCurrentIndex(idx);
      }
    }
  }, [allSources]);

  // Panel controls
  const openPanel = React.useCallback((source: ChatSource, number: number) => {
    setActiveSourceState(source);
    setActiveCitationNumber(number);
    setIsPanelOpen(true);
    // Find index
    const idx = number - 1;
    if (idx >= 0 && idx < allSources.length) {
      setCurrentIndex(idx);
    }
  }, [allSources]);

  const closePanel = React.useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  // Navigation
  const canGoNext = currentIndex < allSources.length - 1;
  const canGoPrevious = currentIndex > 0;

  const goToNext = React.useCallback(() => {
    if (canGoNext) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setActiveSourceState(allSources[newIndex]);
      setActiveCitationNumber(newIndex + 1);
    }
  }, [currentIndex, canGoNext, allSources]);

  const goToPrevious = React.useCallback(() => {
    if (canGoPrevious) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setActiveSourceState(allSources[newIndex]);
      setActiveCitationNumber(newIndex + 1);
    }
  }, [currentIndex, canGoPrevious, allSources]);

  const goToIndex = React.useCallback((index: number) => {
    if (index >= 0 && index < allSources.length) {
      setCurrentIndex(index);
      setActiveSourceState(allSources[index]);
      setActiveCitationNumber(index + 1);
    }
  }, [allSources]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isPanelOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.key) {
        case "j":
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "k":
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "Escape":
          e.preventDefault();
          closePanel();
          break;
        default:
          // Handle number keys 1-9 for direct navigation
          const num = parseInt(e.key, 10);
          if (num >= 1 && num <= 9 && num <= allSources.length) {
            e.preventDefault();
            goToIndex(num - 1);
          }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, goToNext, goToPrevious, goToIndex, closePanel, allSources.length]);

  const value = React.useMemo<CitationContextValue>(() => ({
    activeSource,
    activeCitationNumber,
    setActiveSource,
    allSources,
    setAllSources,
    isPanelOpen,
    openPanel,
    closePanel,
    currentIndex,
    goToNext,
    goToPrevious,
    goToIndex,
    canGoNext,
    canGoPrevious,
    preferredView,
    setPreferredView,
    isMobile,
  }), [
    activeSource,
    activeCitationNumber,
    setActiveSource,
    allSources,
    isPanelOpen,
    openPanel,
    closePanel,
    currentIndex,
    goToNext,
    goToPrevious,
    goToIndex,
    canGoNext,
    canGoPrevious,
    preferredView,
    isMobile,
  ]);

  return (
    <CitationContext.Provider value={value}>
      {children}
    </CitationContext.Provider>
  );
}

export function useCitation() {
  const context = React.useContext(CitationContext);
  if (!context) {
    throw new Error("useCitation must be used within a CitationProvider");
  }
  return context;
}

// Optional hook that doesn't throw if context is missing
export function useCitationOptional() {
  return React.useContext(CitationContext);
}
