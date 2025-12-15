"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CitationNavigationProps {
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToIndex?: (index: number) => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  /** Show number buttons for direct navigation */
  showNumberButtons?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  className?: string;
}

/**
 * Navigation controls for cycling through citations.
 * Shows prev/next buttons and current position indicator.
 */
export function CitationNavigation({
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
  onGoToIndex,
  canGoPrevious,
  canGoNext,
  showNumberButtons = false,
  compact = false,
  className,
}: CitationNavigationProps) {
  if (totalCount <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2",
        className
      )}
    >
      {/* Previous button */}
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={cn(
          compact ? "h-7 w-7" : "h-8",
          "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Previous citation"
      >
        <ChevronLeft className={compact ? "h-4 w-4" : "h-4 w-4 mr-1"} />
        {!compact && <span className="sr-only sm:not-sr-only">Prev</span>}
      </Button>

      {/* Position indicator or number buttons */}
      {showNumberButtons && totalCount <= 9 ? (
        <div className="flex items-center gap-1">
          {Array.from({ length: totalCount }, (_, i) => (
            <button
              key={i}
              onClick={() => onGoToIndex?.(i)}
              className={cn(
                "h-6 w-6 rounded text-xs font-medium transition-colors",
                currentIndex === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              )}
              aria-label={`Go to citation ${i + 1}`}
              aria-current={currentIndex === i ? "true" : undefined}
            >
              {i + 1}
            </button>
          ))}
        </div>
      ) : (
        <span className={cn(
          "text-sm text-muted-foreground font-medium tabular-nums",
          compact && "text-xs"
        )}>
          {currentIndex + 1} of {totalCount}
        </span>
      )}

      {/* Next button */}
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        onClick={onNext}
        disabled={!canGoNext}
        className={cn(
          compact ? "h-7 w-7" : "h-8",
          "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Next citation"
      >
        {!compact && <span className="sr-only sm:not-sr-only">Next</span>}
        <ChevronRight className={compact ? "h-4 w-4" : "h-4 w-4 ml-1"} />
      </Button>
    </div>
  );
}

/**
 * Keyboard shortcut hints for navigation
 */
export function CitationNavigationHints({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">J</kbd>
        <span>Next</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">K</kbd>
        <span>Prev</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">Esc</kbd>
        <span>Close</span>
      </span>
    </div>
  );
}
