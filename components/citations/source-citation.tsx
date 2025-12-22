"use client";

import * as React from "react";
import { FileText, Scale, Gavel, ScrollText, Table2, type LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SourceDetailDialog } from "./source-detail-dialog";
import { useCitationOptional } from "./citation-context";
import type { ChatSource, DocumentType } from "@/lib/api/types";

interface SourceCitationProps {
  /** The citation numbers (e.g., [1] or [1, 3]) */
  numbers: number[];
  /** The sources array to look up */
  sources: ChatSource[];
  /** Display text (defaults to "[n]" or "[n, m]") */
  children?: React.ReactNode;
}

const documentIconMap: Record<DocumentType, LucideIcon> = {
  act: FileText,
  judgment: Gavel,
  regulation: ScrollText,
  constitution: Scale,
};

/**
 * Get color classes for document type badge
 */
function getTypeBadgeColor(type: DocumentType) {
  switch (type) {
    case "act":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
    case "judgment":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
    case "regulation":
      return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
    case "constitution":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300";
  }
}

/**
 * Get relevance level from score
 */
function getRelevanceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}

/**
 * Get relevance dot color classes
 */
function getRelevanceDotColor(level: "high" | "medium" | "low") {
  switch (level) {
    case "high":
      return "bg-green-500 dark:bg-green-400";
    case "medium":
      return "bg-yellow-500 dark:bg-yellow-400";
    case "low":
      return "bg-orange-500 dark:bg-orange-400";
  }
}

/**
 * Get relevance label for accessibility
 */
function getRelevanceLabel(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high":
      return "high relevance";
    case "medium":
      return "medium relevance";
    case "low":
      return "low relevance";
  }
}

/**
 * Quality indicator dot component
 */
function QualityDot({ score }: { score: number }) {
  if (score <= 0) return null;

  const level = getRelevanceLevel(score);
  const colorClass = getRelevanceDotColor(level);
  const label = getRelevanceLabel(level);

  return (
    <span
      className={cn(
        "inline-block w-1.5 h-1.5 rounded-full ml-0.5 align-middle",
        colorClass
      )}
      title={`${Math.round(score * 100)}% relevance (${label})`}
      aria-hidden="true"
    />
  );
}

/**
 * Detect if text contains table data and get info about it
 */
function detectTableInfo(text: string): { isTable: boolean; rowCount: number; columnCount: number } {
  const pipeCount = (text.match(/\|/g) || []).length;
  if (pipeCount < 2) return { isTable: false, rowCount: 0, columnCount: 0 };

  const lines = text.split(/\n/).filter(line => line.trim() && line.includes('|'));

  if (lines.length >= 2) {
    const firstLine = lines[0];
    const columnCount = firstLine.split('|').filter(c => c.trim()).length;
    return { isTable: true, rowCount: lines.length, columnCount };
  }

  const numberedPattern = /\d+\.?\s*\|/g;
  const numberedMatches = text.match(numberedPattern);
  if (numberedMatches && numberedMatches.length >= 2) {
    const avgPipesPerRow = pipeCount / numberedMatches.length;
    return { isTable: true, rowCount: numberedMatches.length, columnCount: Math.round(avgPipesPerRow) + 1 };
  }

  return { isTable: false, rowCount: 0, columnCount: 0 };
}

/**
 * Truncate text to a maximum length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Check if a string looks like a document ID
 */
function isDocumentId(value: string): boolean {
  return /^[A-Z]+-([A-Z]+-)?(\d{4}-)?\d+$/i.test(value);
}

/**
 * Format a section reference for display
 */
function formatSectionRef(section: string | undefined, sectionId?: string | undefined, excerpt?: string | undefined): string | null {
  for (const input of [section, sectionId]) {
    if (!input) continue;
    if (isDocumentId(input)) continue;

    const sectionMatch = input.match(/(Section\s+\d+(?:\s*\([^)]+\))?)/i);
    if (sectionMatch) return sectionMatch[1];

    const numberedMatch = input.match(/^(\d+)\.\s/);
    if (numberedMatch) return `Section ${numberedMatch[1]}`;

    if (input.includes(">")) {
      const parts = input.split(">").map(p => p.trim());
      for (const part of parts) {
        if (isDocumentId(part)) continue;
        const partMatch = part.match(/^(\d+)\.\s/);
        if (partMatch) return `Section ${partMatch[1]}`;
        const secMatch = part.match(/Section\s+(\d+)/i);
        if (secMatch) return `Section ${secMatch[1]}`;
      }
    }

    const eIdMatch = input.match(/sec_(\d+)(?:__subsec_(\d+))?(?:__para_([a-z]))?/i);
    if (eIdMatch) {
      let ref = `Section ${eIdMatch[1]}`;
      if (eIdMatch[2]) ref += `(${eIdMatch[2]})`;
      if (eIdMatch[3]) ref += `(${eIdMatch[3]})`;
      return ref;
    }

    if (/^\d+$/.test(input)) return `Section ${input}`;
  }

  if (excerpt) {
    const subsecMatch = excerpt.match(/^\s*\((\d+)\)\s/);
    if (subsecMatch) return `Subsection (${subsecMatch[1]})`;
  }

  return null;
}

/**
 * SourceCitation - Hoverable numbered citation that shows source details
 *
 * Renders citations like [1], [2, 3] as interactive elements that show
 * the source excerpt on hover and open a detailed view on click.
 */
export function SourceCitation({
  numbers,
  sources,
  children,
}: SourceCitationProps) {
  const [openDialogIdx, setOpenDialogIdx] = React.useState<number | null>(null);
  const citationContext = useCitationOptional();

  // Get the relevant sources (1-indexed to 0-indexed)
  const relevantSources = numbers
    .map((n) => sources[n - 1])
    .filter((s): s is ChatSource => s !== undefined);

  // Default display text
  const displayText = children || `[${numbers.join(", ")}]`;

  // If no matching sources, just render the text without hover
  if (relevantSources.length === 0) {
    return <span className="text-primary font-medium">{displayText}</span>;
  }

  // Handle click - set sources and open panel if context available, otherwise dialog
  const handleClick = (source: ChatSource, number: number, dialogIdx: number) => {
    if (citationContext) {
      // Pass sources to openPanel to set atomically and avoid stale closure
      citationContext.openPanel(source, number, sources);
    } else {
      setOpenDialogIdx(dialogIdx);
    }
  };

  // For single source
  if (relevantSources.length === 1) {
    const source = relevantSources[0];
    const Icon = documentIconMap[source.document_type] || FileText;
    const tableInfo = detectTableInfo(source.excerpt);
    const sectionRef = source.legal_reference || formatSectionRef(source.section, source.section_id, source.excerpt);
    const relevanceLevel = source.relevance_score > 0 ? getRelevanceLevel(source.relevance_score) : null;

    // Build accessible label
    const ariaLabel = [
      `Citation ${numbers[0]}`,
      sectionRef,
      source.title,
      source.document_type,
      relevanceLevel ? `${relevanceLevel} relevance` : null,
    ].filter(Boolean).join(", ");

    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              onClick={() => handleClick(source, numbers[0], 0)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(source, numbers[0], 0);
                }
              }}
              className="inline-flex items-center gap-0.5 text-primary font-medium hover:underline cursor-pointer"
              aria-label={ariaLabel}
              aria-haspopup="dialog"
            >
              {displayText}
              <QualityDot score={source.relevance_score} />
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={5}
            className={cn(
              "max-w-sm p-3 text-left",
              "bg-popover text-popover-foreground border border-border shadow-lg"
            )}
          >
            {(source.legal_reference || formatSectionRef(source.section, source.section_id, source.excerpt)) && (
              <span className="block text-xs font-semibold text-primary mb-1">
                {source.legal_reference || formatSectionRef(source.section, source.section_id, source.excerpt)}
              </span>
            )}
            <span className="flex items-center gap-2 mb-1.5">
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium text-sm text-foreground truncate">{source.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${getTypeBadgeColor(source.document_type)}`}>
                {source.document_type}
              </span>
            </span>
            <span className="block text-xs text-muted-foreground mb-1.5">
              {source.human_readable_id}
            </span>

            {tableInfo.isTable ? (
              <span className="block">
                <span className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
                  <Table2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground">
                    <span className="font-medium">Table Data</span>
                    <span className="text-muted-foreground ml-1">
                      · {tableInfo.rowCount} rows × {tableInfo.columnCount} columns
                    </span>
                  </span>
                </span>
                <span className="block text-[11px] text-muted-foreground mt-1.5 italic">
                  Click to view the complete table
                </span>
              </span>
            ) : (
              <span className="block text-xs leading-relaxed text-foreground/80 line-clamp-3">
                &quot;{truncate(source.excerpt, 150)}&quot;
              </span>
            )}

            <span className="block mt-2 text-[10px] text-primary font-medium">
              {tableInfo.isTable ? "Click to view full table →" : "Click for full details →"}
            </span>
          </TooltipContent>
        </Tooltip>

        <SourceDetailDialog
          source={source}
          citationNumber={numbers[0]}
          open={openDialogIdx === 0}
          onOpenChange={(open) => setOpenDialogIdx(open ? 0 : null)}
        />
      </>
    );
  }

  // Multiple sources - show combined tooltip with click to select
  // Use highest relevance score for the combined indicator
  const highestRelevance = Math.max(...relevantSources.map(s => s.relevance_score || 0));
  const multiAriaLabel = `Citations ${numbers.join(", ")}, ${relevantSources.length} sources from ${[...new Set(relevantSources.map(s => s.document_type))].join(" and ")} documents`;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            onClick={() => handleClick(relevantSources[0], numbers[0], 0)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick(relevantSources[0], numbers[0], 0);
              }
            }}
            className="inline-flex items-center gap-0.5 text-primary font-medium hover:underline cursor-pointer"
            aria-label={multiAriaLabel}
            aria-haspopup="dialog"
          >
            {displayText}
            <QualityDot score={highestRelevance} />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={5}
          className={cn(
            "max-w-md p-3 text-left",
            "bg-popover text-popover-foreground border border-border shadow-lg"
          )}
        >
          <span className="block font-medium text-sm text-foreground mb-2">
            {relevantSources.length} Sources (click for details)
          </span>
          {relevantSources.map((source, idx) => {
            const Icon = documentIconMap[source.document_type] || FileText;
            const tableInfo = detectTableInfo(source.excerpt);
            return (
              <span key={`${source.document_id}-${idx}`} className="block mb-2 last:mb-0">
                <span className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick(source, numbers[idx], idx);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClick(source, numbers[idx], idx);
                      }
                    }}
                    className="text-xs font-medium text-primary hover:underline truncate text-left cursor-pointer"
                  >
                    [{numbers[idx]}] {source.title}
                  </span>
                </span>
                {tableInfo.isTable ? (
                  <span className="flex items-center gap-1.5 ml-4 text-[11px] text-muted-foreground">
                    <Table2 className="h-3 w-3" />
                    Table · {tableInfo.rowCount} rows
                  </span>
                ) : (
                  <span className="block text-[11px] text-muted-foreground ml-4 line-clamp-2">
                    &quot;{truncate(source.excerpt, 80)}&quot;
                  </span>
                )}
              </span>
            );
          })}
        </TooltipContent>
      </Tooltip>

      {/* Dialogs for each source - fallback when no context */}
      {relevantSources.map((source, idx) => (
        <SourceDetailDialog
          key={`dialog-${source.document_id}-${idx}`}
          source={source}
          citationNumber={numbers[idx]}
          open={openDialogIdx === idx}
          onOpenChange={(open) => setOpenDialogIdx(open ? idx : null)}
        />
      ))}
    </>
  );
}

/**
 * Parse citation references from text and return segments
 */
export interface CitationSegment {
  type: "text" | "citation";
  content: string;
  numbers?: number[];
}

export function parseSourceCitations(text: string): CitationSegment[] {
  const segments: CitationSegment[] = [];
  const citationPattern = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

  let lastIndex = 0;
  let match;

  while ((match = citationPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    const numbersStr = match[1];
    const numbers = numbersStr.split(/\s*,\s*/).map((n) => parseInt(n, 10));

    segments.push({
      type: "citation",
      content: match[0],
      numbers,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments;
}
