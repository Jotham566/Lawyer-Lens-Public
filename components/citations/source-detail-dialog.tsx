"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLink,
  FileText,
  Scale,
  Gavel,
  ScrollText,
  Copy,
  Check,
  BookOpen,
  Hash,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { expandSource, getDocumentSection } from "@/lib/api/documents";
import { sanitizeDocumentHtml } from "@/lib/utils/sanitize";
import type { ChatSource, DocumentType, ExpandedTable, SectionResponse } from "@/lib/api/types";

interface SourceDetailDialogProps {
  source: ChatSource;
  citationNumber: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

    // Pattern 2: "X. Title" format (e.g., "11. Imposition of excise duty")
    const numberedMatch = input.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      return `Section ${numberedMatch[1]}`;
    }

    // Pattern 3: Breadcrumb path - extract section info
    // But skip document IDs in the path
    if (input.includes(">")) {
      const parts = input.split(">").map(p => p.trim());
      // Look for a part that looks like a section
      for (const part of parts) {
        // Skip document ID parts
        if (isDocumentId(part)) continue;

        const numMatch = part.match(/^(\d+)\./);
        if (numMatch) {
          return `Section ${numMatch[1]}`;
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

    // Pattern 5: Just a number
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
 * Format section reference from AKN section data
 */
function formatSectionFromData(sectionData: SectionResponse | null): string | null {
  if (!sectionData) return null;

  // Prefer the backend-provided legal_reference if available
  if (sectionData.legal_reference) {
    return sectionData.legal_reference;
  }

  const { section_type, number, eid } = sectionData;

  // If we have a number, use it
  if (number) {
    const cleanNum = number.replace(/\.$/, ""); // Remove trailing dot
    if (section_type === "section") {
      return `Section ${cleanNum}`;
    } else if (section_type === "subsection") {
      // Extract parent section from eId if possible
      const parentMatch = eid?.match(/sec_(\d+)__/);
      if (parentMatch) {
        return `Section ${parentMatch[1]}(${cleanNum})`;
      }
      return `Subsection (${cleanNum})`;
    } else if (section_type === "paragraph") {
      return `Paragraph (${cleanNum})`;
    }
    return `${section_type} ${cleanNum}`;
  }

  // Fallback to parsing the eId
  if (eid) {
    return formatSectionRef(undefined, eid);
  }

  return null;
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
 * Get color classes for document type
 */
function getTypeColor(type: DocumentType) {
  switch (type) {
    case "act":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        icon: "text-blue-600 dark:text-blue-400",
      };
    case "judgment":
      return {
        bg: "bg-purple-50 dark:bg-purple-950/50",
        border: "border-purple-200 dark:border-purple-800",
        text: "text-purple-700 dark:text-purple-300",
        icon: "text-purple-600 dark:text-purple-400",
      };
    case "regulation":
      return {
        bg: "bg-green-50 dark:bg-green-950/50",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-700 dark:text-green-300",
        icon: "text-green-600 dark:text-green-400",
      };
    case "constitution":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/50",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-700 dark:text-amber-300",
        icon: "text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        bg: "bg-gray-50 dark:bg-gray-950/50",
        border: "border-gray-200 dark:border-gray-800",
        text: "text-gray-700 dark:text-gray-300",
        icon: "text-gray-600 dark:text-gray-400",
      };
  }
}

/**
 * Parse table from text content
 * Handles multiple formats:
 * - Pipe-separated: "Header1 | Header2 | Header3"
 * - Numbered rows: "1. | Value | Value"
 * - Line-based tables
 */
function parseTableFromText(text: string): { headers: string[]; rows: string[][] } | null {
  // Check for pipe characters
  const pipeCount = (text.match(/\|/g) || []).length;
  if (pipeCount < 2) return null;

  const lines = text.split(/\n/).filter(line => line.trim());

  if (lines.length < 2) {
    // Try splitting by numbered patterns like "1. |"
    const numberedPattern = /(\d+\.?\s*\|[^|]+(?:\|[^|]+)*)/g;
    const matches = text.match(numberedPattern);

    if (matches && matches.length >= 2) {
      const rows = matches.map(match =>
        match.split('|').map(cell => cell.replace(/^\d+\.?\s*/, '').trim()).filter(Boolean)
      );

      // Try to detect header from first row or create generic headers
      const maxCols = Math.max(...rows.map(r => r.length));
      const headers = rows[0].length === maxCols && !rows[0][0].match(/^\d/)
        ? rows[0]
        : Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);

      const dataRows = rows[0].length === maxCols && !rows[0][0].match(/^\d/)
        ? rows.slice(1)
        : rows;

      if (dataRows.length > 0) {
        return { headers, rows: dataRows };
      }
    }
    return null;
  }

  // Parse line-based table
  const parsedRows = lines.map(line =>
    line.split('|').map(cell => cell.trim()).filter(Boolean)
  ).filter(row => row.length > 0);

  if (parsedRows.length < 2) return null;

  // First row as headers if it doesn't start with a number
  const firstRow = parsedRows[0];
  const isFirstRowHeader = !firstRow[0].match(/^\d+\.?\s*$/);

  const headers = isFirstRowHeader
    ? firstRow
    : Array.from({ length: Math.max(...parsedRows.map(r => r.length)) }, (_, i) => `Column ${i + 1}`);

  const dataRows = isFirstRowHeader ? parsedRows.slice(1) : parsedRows;

  return { headers, rows: dataRows };
}

/**
 * Render table component from parsed text
 */
function TableDisplay({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="hover:bg-muted/30 transition-colors"
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-3 text-foreground"
                >
                  {cell}
                </td>
              ))}
              {/* Fill empty cells if row is shorter than headers */}
              {row.length < headers.length &&
                Array.from({ length: headers.length - row.length }, (_, i) => (
                  <td key={`empty-${i}`} className="px-4 py-3 text-muted-foreground">
                    —
                  </td>
                ))
              }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Render expanded table from hierarchical structure
 */
function ExpandedTableDisplay({ table }: { table: ExpandedTable }) {
  const headerRowIndices = new Set(table.header_rows || [0]);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {table.rows.map((row, rowIdx) => {
            const isHeader = headerRowIndices.has(rowIdx);
            const Tag = isHeader ? "th" : "td";
            return (
              <tr
                key={rowIdx}
                className={isHeader ? "bg-muted/50" : "hover:bg-muted/30 transition-colors"}
              >
                {row.map((cell, cellIdx) => (
                  <Tag
                    key={cellIdx}
                    className={`px-4 py-3 ${isHeader ? "text-left font-semibold" : ""} text-foreground`}
                  >
                    {cell}
                  </Tag>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Relevance score indicator
 */
function RelevanceIndicator({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const getColor = () => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-24">
        <div
          className={`h-full ${getColor()} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        {percentage}% match
      </span>
    </div>
  );
}

/**
 * SourceDetailDialog - Full source detail view with table support
 *
 * Features:
 * - Proper table rendering from pipe-separated text
 * - Copy to clipboard functionality
 * - Visual relevance indicator
 * - Responsive design with proper scroll handling
 * - Clear visual hierarchy
 * - Fetches expanded content for tables that span multiple pages
 */
export function SourceDetailDialog({
  source,
  citationNumber,
  open,
  onOpenChange,
}: SourceDetailDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const [showRaw, setShowRaw] = React.useState(false);
  const [isExpanding, setIsExpanding] = React.useState(false);
  const [expandedContent, setExpandedContent] = React.useState<string | null>(null);
  const [expandedTables, setExpandedTables] = React.useState<ExpandedTable[]>([]);
  const [sectionData, setSectionData] = React.useState<SectionResponse | null>(null);
  const [htmlContent, setHtmlContent] = React.useState<string | null>(null);

  // Use ref to track fetch state (avoids StrictMode double-execution issues)
  const fetchStateRef = React.useRef<'idle' | 'fetching' | 'done'>('idle');

  const Icon = getDocumentIcon(source.document_type);
  const colors = getTypeColor(source.document_type);

  // Use expanded content if available, otherwise use original
  const displayExcerpt = expandedContent || source.excerpt;

  // Parse table data if present
  const tableData = parseTableFromText(displayExcerpt);
  const hasTable = tableData !== null || expandedTables.length > 0;

  // Fetch the full section content when dialog opens
  // Priority: section_id (AKN eId) > expand-source fallback
  React.useEffect(() => {
    // Only fetch once per dialog open - use ref to avoid StrictMode double-execution
    if (!open || fetchStateRef.current !== 'idle') {
      return;
    }

    // Mark as fetching immediately (ref update is synchronous)
    fetchStateRef.current = 'fetching';
    setIsExpanding(true);

    // Timeout to prevent endless loading if endpoints fail silently
    const timeoutId = setTimeout(() => {
      setIsExpanding(false);
      fetchStateRef.current = 'done';
    }, 8000);

    const fetchContent = async () => {
      try {
        // Strategy 1: If we have a section_id that looks like a full AKN eId (not ambiguous),
        // use the section endpoint for richer metadata
        const isFullEId = source.section_id && (
          source.section_id.includes("__") ||
          source.section_id.startsWith("sec_") ||
          source.section_id.startsWith("part_")
        );

        if (source.section_id && isFullEId) {
          try {
            const section = await getDocumentSection(source.document_id, source.section_id);

            // Sanity check: Only use section data if content matches the excerpt
            const excerptStart = source.excerpt.slice(0, 50).toLowerCase().replace(/\s+/g, " ");
            const sectionStart = section.content?.slice(0, 100).toLowerCase().replace(/\s+/g, " ") || "";
            const excerptWords = excerptStart.split(" ").slice(0, 5).join(" ");
            const contentMatches = sectionStart.includes(excerptWords) ||
                                   section.content?.toLowerCase().includes(excerptWords);

            if (contentMatches) {
              clearTimeout(timeoutId);
              setSectionData(section);
              if (section.content) setExpandedContent(section.content);
              if (section.html_content) setHtmlContent(section.html_content);
              setIsExpanding(false);
              fetchStateRef.current = 'done';
              return;
            }
          } catch {
            // Section endpoint failed - fall through to expand-source
          }
        }

        // Strategy 2: Fall back to expand-source endpoint
        const response = await expandSource(
          source.document_id,
          source.excerpt,
          source.section || undefined
        );

        clearTimeout(timeoutId);
        if (response.full_excerpt && response.full_excerpt.length > source.excerpt.length) {
          setExpandedContent(response.full_excerpt);
        }
        if (response.tables && response.tables.length > 0) {
          setExpandedTables(response.tables);
        }
      } catch (err) {
        console.warn("Could not expand source:", err);
      } finally {
        clearTimeout(timeoutId);
        setIsExpanding(false);
        fetchStateRef.current = 'done';
      }
    };

    fetchContent();
  }, [open, source.document_id, source.section_id, source.excerpt, source.section]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setExpandedContent(null);
      setExpandedTables([]);
      setSectionData(null);
      setHtmlContent(null);
      setShowRaw(false);
      setIsExpanding(false);
      fetchStateRef.current = 'idle';  // Reset so next open can fetch fresh
    }
  }, [open]);

  // Copy the displayed content to clipboard
  const handleCopy = async () => {
    try {
      // Copy what's actually displayed, not the original excerpt
      // This ensures deduplication and expanded content is preserved
      await navigator.clipboard.writeText(displayExcerpt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header Section */}
        <DialogHeader className="flex-shrink-0 p-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`rounded-xl p-3 ${colors.bg} ${colors.border} border`}>
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>

            {/* Title and metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {/* Section reference - shown prominently */}
                  {/* Priority: 1. sectionData from API, 2. source.legal_reference from backend, 3. extracted */}
                  {(formatSectionFromData(sectionData) || source.legal_reference || formatSectionRef(source.section, source.section_id, source.excerpt)) && (
                    <span className="inline-block text-sm font-semibold text-primary mb-1">
                      {formatSectionFromData(sectionData) || source.legal_reference || formatSectionRef(source.section, source.section_id, source.excerpt)}
                    </span>
                  )}
                  <DialogTitle className="text-xl font-semibold text-foreground leading-tight">
                    {sectionData?.heading || source.title}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-muted-foreground">
                    Citation [{citationNumber}] from {source.title}
                  </DialogDescription>
                </div>
                <Badge
                  variant="outline"
                  className={`capitalize shrink-0 ${colors.bg} ${colors.border} ${colors.text}`}
                >
                  {source.document_type}
                </Badge>
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  {source.human_readable_id}
                </span>
                {/* Show section heading if available */}
                {sectionData?.heading && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    {sectionData.heading}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Content Section - using overflow-y-auto directly */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* Relevance Score */}
            {source.relevance_score > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Relevance to your query
                </span>
                <RelevanceIndicator score={source.relevance_score} />
              </div>
            )}

            {/* Content Display */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {sectionData ? "Section Content" : hasTable && !showRaw ? "Source Data (Table)" : "Excerpt Content"}
                </h3>
                <div className="flex items-center gap-2">
                  {/* Toggle between HTML and raw text when HTML is available */}
                  {(htmlContent || hasTable) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRaw(!showRaw)}
                      className="h-8 px-2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      {showRaw ? (htmlContent ? "Show Formatted" : "Show Table") : "Show Raw"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Loading state */}
              {isExpanding && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm">Loading section content...</span>
                </div>
              )}

              {/* Show HTML content from AKN XML section when available */}
              {!isExpanding && htmlContent && !showRaw && (
                <div
                  className="rounded-lg border border-border bg-muted/30 p-4 prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: sanitizeDocumentHtml(htmlContent) }}
                />
              )}

              {/* Show expanded tables from hierarchical structure */}
              {!isExpanding && !htmlContent && expandedTables.length > 0 && !showRaw && (
                <div className="space-y-4">
                  {expandedTables.map((table, idx) => (
                    <div key={idx}>
                      {table.section && (
                        <p className="text-xs text-muted-foreground mb-2">{table.section}</p>
                      )}
                      <ExpandedTableDisplay table={table} />
                    </div>
                  ))}
                </div>
              )}

              {/* Show parsed table from text when no HTML and no expanded tables */}
              {!isExpanding && !htmlContent && !showRaw && expandedTables.length === 0 && hasTable && tableData && (
                <div className="overflow-x-auto">
                  <TableDisplay headers={tableData.headers} rows={tableData.rows} />
                </div>
              )}

              {/* Show plain text content when no HTML, no tables, and not raw mode */}
              {!isExpanding && !htmlContent && !showRaw && expandedTables.length === 0 && !hasTable && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <pre className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                    {displayExcerpt}
                  </pre>
                </div>
              )}

              {/* Show raw content when toggled */}
              {!isExpanding && showRaw && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <pre className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                    {displayExcerpt}
                  </pre>
                </div>
              )}
            </div>

            {/* Content source indicator */}
            {!isExpanding && sectionData && !showRaw && (
              <p className="text-xs text-muted-foreground">
                Content extracted from {sectionData.section_type} {sectionData.number || sectionData.eid}
                {sectionData.children_eids.length > 0 && ` (includes ${sectionData.children_eids.length} subsection${sectionData.children_eids.length > 1 ? "s" : ""})`}
              </p>
            )}

            {/* Row count for tables */}
            {!isExpanding && !sectionData && hasTable && tableData && !showRaw && expandedTables.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Showing {tableData.rows.length} rows × {tableData.headers.length} columns
                {expandedContent && " (expanded)"}
              </p>
            )}

            {/* Expanded tables count */}
            {!isExpanding && !sectionData && expandedTables.length > 0 && !showRaw && (
              <p className="text-xs text-muted-foreground">
                Showing {expandedTables.length} complete table{expandedTables.length > 1 ? "s" : ""} from document
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            View the complete document for full context
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button asChild>
              <Link
                href={`/document/${source.document_id}`}
                className="flex items-center gap-2"
              >
                View Full Document
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
