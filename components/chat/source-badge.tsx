"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FileText, Scale, BookOpen, ScrollText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSource } from "@/lib/api/types";

// Deduplicated source with reference count
interface DeduplicatedSource {
  source: ChatSource;
  count: number;
}

// Get icon based on document type
function getDocumentIcon(documentType: string) {
  switch (documentType) {
    case "act":
      return ScrollText;
    case "judgment":
      return Scale;
    case "regulation":
      return BookOpen;
    case "constitution":
      return BookOpen;
    default:
      return FileText;
  }
}

// Get subtle accent color based on document type
function getAccentClass(documentType: string): string {
  switch (documentType) {
    case "act":
      return "text-blue-600 dark:text-blue-400";
    case "judgment":
      return "text-purple-600 dark:text-purple-400";
    case "regulation":
      return "text-green-600 dark:text-green-400";
    case "constitution":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-muted-foreground";
  }
}

interface SourceItemProps {
  source: ChatSource;
  count: number;
}

function SourceItem({ source, count }: SourceItemProps) {
  const Icon = getDocumentIcon(source.document_type);
  const accentClass = getAccentClass(source.document_type);

  return (
    <Link
      href={`/document/${source.document_id}`}
      className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", accentClass)} />
      <span className="truncate max-w-[200px]">{source.title}</span>
      {count > 1 && (
        <span className="text-xs text-muted-foreground/70">({count})</span>
      )}
    </Link>
  );
}

interface SourceBadgeListProps {
  sources: ChatSource[];
  maxVisible?: number;
}

export function SourceBadgeList({ sources, maxVisible = 4 }: SourceBadgeListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Deduplicate sources by document_id and count references
  const deduplicatedSources = useMemo(() => {
    if (!sources || sources.length === 0) return [];

    const sourceMap = new Map<string, DeduplicatedSource>();

    for (const source of sources) {
      const existing = sourceMap.get(source.document_id);
      if (existing) {
        existing.count += 1;
      } else {
        sourceMap.set(source.document_id, { source, count: 1 });
      }
    }

    return Array.from(sourceMap.values());
  }, [sources]);

  if (deduplicatedSources.length === 0) return null;

  const visibleSources = isExpanded
    ? deduplicatedSources
    : deduplicatedSources.slice(0, maxVisible);
  const hiddenCount = deduplicatedSources.length - maxVisible;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Sources ({deduplicatedSources.length})
      </p>
      <div className="flex flex-col gap-1.5">
        {visibleSources.map((item) => (
          <SourceItem
            key={item.source.document_id}
            source={item.source}
            count={item.count}
          />
        ))}
        {hiddenCount > 0 && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="h-3 w-3" />
            <span>Show {hiddenCount} more</span>
          </button>
        )}
        {isExpanded && hiddenCount > 0 && (
          <button
            onClick={() => setIsExpanded(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="h-3 w-3 rotate-180" />
            <span>Show less</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Keep SourceBadge export for backwards compatibility if used elsewhere
interface SourceBadgeProps {
  source: ChatSource;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return <SourceItem source={source} count={1} />;
}
