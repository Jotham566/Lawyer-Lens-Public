"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface HighlightedExcerptProps {
  /** The full excerpt text */
  excerpt: string;
  /** Optional text to highlight within the excerpt */
  highlightText?: string;
  /** Maximum length before truncating (0 = no truncation) */
  maxLength?: number;
  /** Additional class names */
  className?: string;
  /** Whether to show quotes around the text */
  showQuotes?: boolean;
  /** Scroll to highlight when mounted */
  scrollToHighlight?: boolean;
}

/**
 * Highlights a portion of text within an excerpt.
 * Used to show which part of a source was actually cited.
 */
export function HighlightedExcerpt({
  excerpt,
  highlightText,
  maxLength = 0,
  className,
  showQuotes = true,
  scrollToHighlight = false,
}: HighlightedExcerptProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const highlightRef = React.useRef<HTMLElement>(null);

  // Truncate if needed
  const displayText = React.useMemo(() => {
    if (maxLength > 0 && excerpt.length > maxLength) {
      return excerpt.slice(0, maxLength - 3) + "...";
    }
    return excerpt;
  }, [excerpt, maxLength]);

  // Build highlighted content
  const content = React.useMemo(() => {
    if (!highlightText) {
      return showQuotes ? `"${displayText}"` : displayText;
    }

    // Find the highlight position (case-insensitive)
    const lowerExcerpt = displayText.toLowerCase();
    const lowerHighlight = highlightText.toLowerCase();
    const index = lowerExcerpt.indexOf(lowerHighlight);

    if (index === -1) {
      // Highlight text not found, try fuzzy matching
      // Check if first 30 chars of highlight exist
      const shortHighlight = lowerHighlight.slice(0, 30);
      const shortIndex = lowerExcerpt.indexOf(shortHighlight);

      if (shortIndex === -1) {
        return showQuotes ? `"${displayText}"` : displayText;
      }

      // Found partial match
      const before = displayText.slice(0, shortIndex);
      const match = displayText.slice(shortIndex, shortIndex + highlightText.length);
      const after = displayText.slice(shortIndex + highlightText.length);

      return (
        <>
          {showQuotes && '"'}
          {before}
          <mark
            ref={highlightRef}
            className="bg-amber-200 dark:bg-amber-800/50 px-0.5 rounded text-foreground"
          >
            {match}
          </mark>
          {after}
          {showQuotes && '"'}
        </>
      );
    }

    // Found exact match
    const before = displayText.slice(0, index);
    const match = displayText.slice(index, index + highlightText.length);
    const after = displayText.slice(index + highlightText.length);

    return (
      <>
        {showQuotes && '"'}
        {before}
        <mark
          ref={highlightRef}
          className="bg-amber-200 dark:bg-amber-800/50 px-0.5 rounded text-foreground"
        >
          {match}
        </mark>
        {after}
        {showQuotes && '"'}
      </>
    );
  }, [displayText, highlightText, showQuotes]);

  // Scroll to highlight when mounted
  React.useEffect(() => {
    if (scrollToHighlight && highlightRef.current && containerRef.current) {
      const timeout = setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [scrollToHighlight]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "text-sm leading-relaxed text-foreground/80",
        className
      )}
    >
      {content}
    </div>
  );
}

/**
 * Compact version for use in hover previews
 */
export function HighlightedExcerptCompact({
  excerpt,
  highlightText,
  maxLength = 200,
  className,
}: Pick<HighlightedExcerptProps, "excerpt" | "highlightText" | "maxLength" | "className">) {
  return (
    <HighlightedExcerpt
      excerpt={excerpt}
      highlightText={highlightText}
      maxLength={maxLength}
      className={cn("line-clamp-4", className)}
      showQuotes={true}
      scrollToHighlight={false}
    />
  );
}
