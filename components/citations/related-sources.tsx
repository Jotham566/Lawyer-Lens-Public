"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ChatSource } from "@/lib/api/types";

interface RelatedSourcesProps {
  /** Currently active source */
  activeSource: ChatSource;
  /** All sources in the current message */
  allSources: ChatSource[];
  /** Callback when a related source is clicked */
  onSelectSource: (index: number) => void;
  /** Current active index */
  currentIndex: number;
  className?: string;
}

/**
 * Displays related sources from the same document or related documents.
 * Helps users discover other relevant citations without leaving the panel.
 */
export function RelatedSources({
  activeSource,
  allSources,
  onSelectSource,
  currentIndex,
  className,
}: RelatedSourcesProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  // Find sources from the same document (excluding current)
  const sameDocumentSources = React.useMemo(() => {
    return allSources
      .map((source, index) => ({ source, index }))
      .filter(
        ({ source, index }) =>
          source.document_id === activeSource.document_id &&
          index !== currentIndex
      );
  }, [allSources, activeSource.document_id, currentIndex]);

  // Find sources from different documents
  const otherDocumentSources = React.useMemo(() => {
    return allSources
      .map((source, index) => ({ source, index }))
      .filter(
        ({ source, index }) =>
          source.document_id !== activeSource.document_id &&
          index !== currentIndex
      );
  }, [allSources, activeSource.document_id, currentIndex]);

  // Don't render if there are no related sources
  if (sameDocumentSources.length === 0 && otherDocumentSources.length === 0) {
    return null;
  }

  // Format a short reference for display
  const formatShortRef = (source: ChatSource): string => {
    if (source.legal_reference) {
      // Truncate long references
      const ref = source.legal_reference;
      return ref.length > 30 ? ref.slice(0, 30) + "..." : ref;
    }
    if (source.section) {
      return source.section.length > 30
        ? source.section.slice(0, 30) + "..."
        : source.section;
    }
    return source.title.length > 30
      ? source.title.slice(0, 30) + "..."
      : source.title;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <span>
            Related Sources ({sameDocumentSources.length + otherDocumentSources.length})
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        {/* Same document sources */}
        {sameDocumentSources.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-2">
              From this document
            </p>
            <div className="space-y-1">
              {sameDocumentSources.slice(0, 5).map(({ source, index }) => (
                <button
                  key={`${source.document_id}-${source.section_id}-${index}`}
                  onClick={() => onSelectSource(index)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm hover:bg-muted transition-colors group"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate text-muted-foreground group-hover:text-foreground transition-colors">
                    {formatShortRef(source)}
                  </span>
                </button>
              ))}
              {sameDocumentSources.length > 5 && (
                <p className="text-xs text-muted-foreground px-2">
                  +{sameDocumentSources.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Other document sources */}
        {otherDocumentSources.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-2">
              Other documents
            </p>
            <div className="space-y-1">
              {otherDocumentSources.slice(0, 3).map(({ source, index }) => (
                <button
                  key={`${source.document_id}-${source.section_id}-${index}`}
                  onClick={() => onSelectSource(index)}
                  className="w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left text-sm hover:bg-muted transition-colors group"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-muted-foreground group-hover:text-foreground transition-colors">
                      {formatShortRef(source)}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground/70">
                      {source.title}
                    </span>
                  </div>
                </button>
              ))}
              {otherDocumentSources.length > 3 && (
                <p className="text-xs text-muted-foreground px-2">
                  +{otherDocumentSources.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
