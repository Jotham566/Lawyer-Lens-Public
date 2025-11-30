"use client";

import * as React from "react";
import { FileText, Scale, Gavel, ScrollText, Table2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SourceDetailDialog } from "./source-detail-dialog";
import type { ChatSource, DocumentType } from "@/lib/api/types";

interface SourceCitationProps {
  /** The citation numbers (e.g., [1] or [1, 3]) */
  numbers: number[];
  /** The sources array to look up */
  sources: ChatSource[];
  /** Display text (defaults to "[n]" or "[n, m]") */
  children?: React.ReactNode;
}

/**
 * Get icon for document type
 */
function getDocumentIcon(type: DocumentType) {
  switch (type) {
    case "act":
      return FileText;
    case "judgment":
      return Gavel;
    case "regulation":
      return ScrollText;
    case "constitution":
      return Scale;
    default:
      return FileText;
  }
}

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
 * Detect if text contains table data and get info about it
 */
function detectTableInfo(text: string): { isTable: boolean; rowCount: number; columnCount: number } {
  const pipeCount = (text.match(/\|/g) || []).length;
  if (pipeCount < 2) return { isTable: false, rowCount: 0, columnCount: 0 };

  // Try to count rows by newlines or numbered patterns
  const lines = text.split(/\n/).filter(line => line.trim() && line.includes('|'));

  if (lines.length >= 2) {
    // Count columns from first line
    const firstLine = lines[0];
    const columnCount = firstLine.split('|').filter(c => c.trim()).length;
    return { isTable: true, rowCount: lines.length, columnCount };
  }

  // Check for numbered row pattern like "1. | ... | 2. | ..."
  const numberedPattern = /\d+\.?\s*\|/g;
  const numberedMatches = text.match(numberedPattern);
  if (numberedMatches && numberedMatches.length >= 2) {
    // Estimate columns from pipe count / row count
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
 * Check if a string looks like a document ID (e.g., "EDA-2014-11", "UGA-ACT-2024-001")
 * These should NOT be shown as section references
 */
function isDocumentId(value: string): boolean {
  // Pattern: letters-numbers-numbers or letters-letters-numbers-numbers
  // e.g., "EDA-2014-11", "UGA-ACT-2024-001"
  return /^[A-Z]+-([A-Z]+-)?(\d{4}-)?\d+$/i.test(value);
}

/**
 * Format a section reference for display
 * Extracts "Section X" or "Section X(Y)" from various formats
 */
function formatSectionRef(section: string | undefined, sectionId?: string | undefined, excerpt?: string | undefined): string | null {
  // Try section first, then sectionId
  for (const input of [section, sectionId]) {
    if (!input) continue;

    // Skip if this looks like a document ID, not a section identifier
    if (isDocumentId(input)) continue;

    // Pattern 1: Already in "Section X" or "Section X(Y)" format
    const sectionMatch = input.match(/(Section\s+\d+(?:\s*\([^)]+\))?)/i);
    if (sectionMatch) {
      return sectionMatch[1];
    }

    // Pattern 2: "X. Title" format at start (e.g., "11. Imposition of excise duty")
    const numberedMatch = input.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      return `Section ${numberedMatch[1]}`;
    }

    // Pattern 3: Breadcrumb path - look for "X. Title" pattern anywhere
    // But skip document IDs in the path
    if (input.includes(">")) {
      const parts = input.split(">").map(p => p.trim());
      for (const part of parts) {
        // Skip document ID parts
        if (isDocumentId(part)) continue;

        // Look for "X. Title" pattern
        const partMatch = part.match(/^(\d+)\.\s/);
        if (partMatch) {
          return `Section ${partMatch[1]}`;
        }
        // Look for "Section X" pattern
        const secMatch = part.match(/Section\s+(\d+)/i);
        if (secMatch) {
          return `Section ${secMatch[1]}`;
        }
      }
    }

    // Pattern 4: section_id format like "sec_11" or "sec_11__subsec_2"
    const eIdMatch = input.match(/sec_(\d+)(?:__subsec_(\d+))?(?:__para_([a-z]))?/i);
    if (eIdMatch) {
      let ref = `Section ${eIdMatch[1]}`;
      if (eIdMatch[2]) ref += `(${eIdMatch[2]})`;
      if (eIdMatch[3]) ref += `(${eIdMatch[3]})`;
      return ref;
    }

    // Pattern 5: Just a number (common for section_id)
    if (/^\d+$/.test(input)) {
      return `Section ${input}`;
    }
  }

  // Pattern 6: Extract from excerpt - look for subsection marker at start
  // e.g., "(1) Subject to this Act..." or "(2) Unless otherwise..."
  if (excerpt) {
    const subsecMatch = excerpt.match(/^\s*\((\d+)\)\s/);
    if (subsecMatch) {
      return `Subsection (${subsecMatch[1]})`;
    }
  }

  return null;
}

/**
 * SourceCitation - Hoverable numbered citation that shows source details
 *
 * Renders citations like [1], [2, 3] as interactive elements that show
 * the source excerpt on hover and open a detailed view on click.
 *
 * Uses Tooltip for hover preview and Dialog for full details (including tables).
 */
export function SourceCitation({
  numbers,
  sources,
  children,
}: SourceCitationProps) {
  const [openDialogIdx, setOpenDialogIdx] = React.useState<number | null>(null);

  // Get the relevant sources (1-indexed to 0-indexed)
  const relevantSources = numbers
    .map((n) => sources[n - 1])
    .filter((s): s is ChatSource => s !== undefined);

  // Default display text
  const displayText = children || `[${numbers.join(", ")}]`;

  // If no matching sources, just render the text without hover
  // (This shouldn't happen if backend sanitizes citations properly)
  if (relevantSources.length === 0) {
    return <span className="text-primary font-medium">{displayText}</span>;
  }

  // For single source
  if (relevantSources.length === 1) {
    const source = relevantSources[0];
    const Icon = getDocumentIcon(source.document_type);
    const tableInfo = detectTableInfo(source.excerpt);

    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpenDialogIdx(0)}
              className="inline-flex items-center gap-0.5 text-primary font-medium hover:underline cursor-pointer"
            >
              {displayText}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-sm p-3 text-left bg-popover text-popover-foreground border border-border shadow-lg"
            sideOffset={5}
          >
            {/* Section reference - shown prominently if available */}
            {/* Prefer backend-provided legal_reference, fall back to extracted reference */}
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
              /* Table preview - show summary instead of truncated pipe text */
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
              /* Text preview - show truncated excerpt */
              <span className="block text-xs leading-relaxed text-foreground/80 line-clamp-3">
                "{truncate(source.excerpt, 150)}"
              </span>
            )}

            <button
              onClick={() => setOpenDialogIdx(0)}
              className="block mt-2 text-[10px] text-primary font-medium hover:underline"
            >
              {tableInfo.isTable ? "View full table →" : "Click for full details →"}
            </button>
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
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpenDialogIdx(0)}
            className="text-primary font-medium hover:underline cursor-pointer"
          >
            {displayText}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-md p-3 text-left bg-popover text-popover-foreground border border-border shadow-lg"
          sideOffset={5}
        >
          <span className="block font-medium text-sm text-foreground mb-2">
            {relevantSources.length} Sources (click for details)
          </span>
          {relevantSources.map((source, idx) => {
            const Icon = getDocumentIcon(source.document_type);
            const tableInfo = detectTableInfo(source.excerpt);
            return (
              <span key={`${source.document_id}-${idx}`} className="block mb-2 last:mb-0">
                <span className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDialogIdx(idx);
                    }}
                    className="text-xs font-medium text-primary hover:underline truncate text-left"
                  >
                    [{numbers[idx]}] {source.title}
                  </button>
                </span>
                {tableInfo.isTable ? (
                  <span className="flex items-center gap-1.5 ml-4 text-[11px] text-muted-foreground">
                    <Table2 className="h-3 w-3" />
                    Table · {tableInfo.rowCount} rows
                  </span>
                ) : (
                  <span className="block text-[11px] text-muted-foreground ml-4 line-clamp-2">
                    "{truncate(source.excerpt, 80)}"
                  </span>
                )}
              </span>
            );
          })}
        </TooltipContent>
      </Tooltip>

      {/* Dialogs for each source */}
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

  // Match patterns like [1], [2], [1, 3], [1, 2, 3]
  const citationPattern = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

  let lastIndex = 0;
  let match;

  while ((match = citationPattern.exec(text)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    // Parse numbers from the citation
    const numbersStr = match[1];
    const numbers = numbersStr.split(/\s*,\s*/).map((n) => parseInt(n, 10));

    segments.push({
      type: "citation",
      content: match[0],
      numbers,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments;
}
