"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Scale,
  Gavel,
  ScrollText,
  Copy,
  Check,
  ExternalLink,
  X,
  Loader2,
  ArrowLeftRight,
  GripVertical,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { expandSource, getDocumentSection } from "@/lib/api/documents";
import { sanitizeDocumentHtml } from "@/lib/utils/sanitize";
import { HighlightedExcerpt } from "./highlighted-excerpt";
import { CitationNavigation, CitationNavigationHints } from "./citation-navigation";
import { RelatedSources } from "./related-sources";
import { CitationExport } from "./citation-export";
import { useCitation } from "./citation-context";
import type { ChatSource, DocumentType, ExpandedTable, SectionResponse } from "@/lib/api/types";

// Document type utilities
const documentIconMap: Record<DocumentType, LucideIcon> = {
  act: FileText,
  judgment: Gavel,
  regulation: ScrollText,
  constitution: Scale,
};

function getTypeColor(type: DocumentType) {
  switch (type) {
    case "act":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-800",
        borderLeft: "border-l-blue-500 dark:border-l-blue-400",
        text: "text-blue-700 dark:text-blue-300",
        icon: "text-blue-600 dark:text-blue-400",
      };
    case "judgment":
      return {
        bg: "bg-purple-50 dark:bg-purple-950/50",
        border: "border-purple-200 dark:border-purple-800",
        borderLeft: "border-l-purple-500 dark:border-l-purple-400",
        text: "text-purple-700 dark:text-purple-300",
        icon: "text-purple-600 dark:text-purple-400",
      };
    case "regulation":
      return {
        bg: "bg-green-50 dark:bg-green-950/50",
        border: "border-green-200 dark:border-green-800",
        borderLeft: "border-l-green-500 dark:border-l-green-400",
        text: "text-green-700 dark:text-green-300",
        icon: "text-green-600 dark:text-green-400",
      };
    case "constitution":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/50",
        border: "border-amber-200 dark:border-amber-800",
        borderLeft: "border-l-amber-500 dark:border-l-amber-400",
        text: "text-amber-700 dark:text-amber-300",
        icon: "text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        bg: "bg-gray-50 dark:bg-gray-950/50",
        border: "border-gray-200 dark:border-gray-800",
        borderLeft: "border-l-gray-500 dark:border-l-gray-400",
        text: "text-gray-700 dark:text-gray-300",
        icon: "text-gray-600 dark:text-gray-400",
      };
  }
}

// Format section reference
function formatSectionRef(source: ChatSource): string | null {
  if (source.legal_reference) return source.legal_reference;

  const section = source.section;
  const sectionId = source.section_id;

  for (const input of [section, sectionId]) {
    if (!input) continue;

    const sectionMatch = input.match(/(Section\s+\d+(?:\s*\([^)]+\))?)/i);
    if (sectionMatch) return sectionMatch[1];

    const numberedMatch = input.match(/^(\d+)\.\s/);
    if (numberedMatch) return `Section ${numberedMatch[1]}`;

    const eIdMatch = input.match(/sec_(\d+)(?:__subsec_(\d+))?(?:__para_([a-z]))?/i);
    if (eIdMatch) {
      let ref = `Section ${eIdMatch[1]}`;
      if (eIdMatch[2]) ref += `(${eIdMatch[2]})`;
      if (eIdMatch[3]) ref += `(${eIdMatch[3]})`;
      return ref;
    }
  }

  return null;
}

// Format section from API data
function formatSectionFromData(sectionData: SectionResponse | null): string | null {
  if (!sectionData) return null;
  if (sectionData.legal_reference) return sectionData.legal_reference;

  const { section_type, number, eid } = sectionData;

  if (number) {
    const cleanNum = number.replace(/\.$/, "");
    if (section_type === "section") return `Section ${cleanNum}`;
    if (section_type === "subsection") {
      const parentMatch = eid?.match(/sec_(\d+)__/);
      if (parentMatch) return `Section ${parentMatch[1]}(${cleanNum})`;
      return `Subsection (${cleanNum})`;
    }
    if (section_type === "paragraph") return `Paragraph (${cleanNum})`;
    return `${section_type} ${cleanNum}`;
  }

  return null;
}



// Expanded table display
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
              <tr key={rowIdx} className={isHeader ? "bg-muted/50" : "hover:bg-muted/30 transition-colors"}>
                {row.map((cell, cellIdx) => (
                  <Tag key={cellIdx} className={`px-3 py-2 ${isHeader ? "text-left font-semibold" : ""} text-foreground`}>
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

// Relevance indicator
function RelevanceIndicator({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const getColor = () => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-20">
        <div className={`h-full ${getColor()} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs text-muted-foreground font-medium">{percentage}%</span>
    </div>
  );
}

/**
 * Source Panel - A slide-out panel for viewing citation details.
 * Shows source content alongside the chat instead of in a blocking modal.
 */
export function SourcePanel() {
  const {
    activeSource,
    activeCitationNumber,
    isPanelOpen,
    closePanel,
    allSources,
    currentIndex,
    goToNext,
    goToPrevious,
    goToIndex,
    canGoNext,
    canGoPrevious,
    toggleCompareMode,
  } = useCitation();

  const [copied, setCopied] = React.useState(false);
  const [showRaw, setShowRaw] = React.useState(false);
  const [isExpanding, setIsExpanding] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Panel resizing state
  const MIN_WIDTH = 320;
  const MAX_WIDTH = 700;
  const DEFAULT_WIDTH = 480;

  const [panelWidth, setPanelWidth] = React.useState(() => {
    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("citation-panel-width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          return parsed;
        }
      }
    }
    return DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = React.useState(false);
  const resizeStartX = React.useRef(0);
  const resizeStartWidth = React.useRef(0);

  // Handle resize drag
  const handleResizeStart = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    resizeStartWidth.current = panelWidth;
  }, [panelWidth]);

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      // Calculate new width (resizing from left edge, so movement left = wider)
      const delta = resizeStartX.current - clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartWidth.current + delta));
      setPanelWidth(newWidth);
    };

    const handleEnd = () => {
      setIsResizing(false);
      // Persist to localStorage
      localStorage.setItem("citation-panel-width", panelWidth.toString());
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleEnd);

    // Prevent text selection while resizing
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing, panelWidth]);

  // Track content with its source key - this prevents needing to reset state on navigation
  // Old content is automatically ignored when sourceKey doesn't match
  const [contentCache, setContentCache] = React.useState<{
    sourceKey: string;
    expandedContent: string | null;
    expandedTables: ExpandedTable[];
    sectionData: SectionResponse | null;
    htmlContent: string | null;
    sectionId: string | null;
  } | null>(null);

  // Source key for tracking - must include section (not just section_id) to differentiate
  // citations from the same document but different sections
  const sourceKey = activeSource
    ? `${activeSource.document_id}-${activeSource.section_id || ''}-${activeSource.section || ''}-${activeSource.excerpt?.substring(0, 50) || ''}`
    : null;

  // Check if cached content matches current source
  const cachedForCurrentSource = contentCache?.sourceKey === sourceKey;

  // Get content for current source (falls back to basic excerpt if no cache match)
  const expandedContent = cachedForCurrentSource ? contentCache.expandedContent : null;
  const expandedTables = cachedForCurrentSource ? contentCache.expandedTables : [];
  const sectionData = cachedForCurrentSource ? contentCache.sectionData : null;
  const htmlContent = cachedForCurrentSource ? contentCache.htmlContent : null;

  // Reset scroll position when navigating to a different source
  React.useEffect(() => {
    if (sourceKey && scrollAreaRef.current) {
      // Find the ScrollArea viewport and scroll to top
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, [sourceKey]);

  // Fetch expanded content when source changes
  React.useEffect(() => {
    if (!isPanelOpen || !activeSource || !sourceKey) return;

    // If we already have cached content for this source, don't refetch
    if (contentCache?.sourceKey === sourceKey) {
      setIsExpanding(false);
      return;
    }

    setIsExpanding(true);
    setShowRaw(false);

    let cancelled = false;

    const fetchContent = async () => {
      try {
        let newExpandedContent: string | null = null;
        let newExpandedTables: ExpandedTable[] = [];
        let newSectionData: SectionResponse | null = null;
        let newHtmlContent: string | null = null;
        let newSectionId: string | null = null;

        // Detect if excerpt is likely table/schedule data (should NOT use section lookup)
        const excerptLower = activeSource.excerpt.toLowerCase();
        const isLikelyTableData =
          activeSource.excerpt.includes('|') || // Table separator
          excerptLower.includes('[schedule') || // Schedule header
          excerptLower.includes('table columns:') || // Table indicator
          /\d+\.\s*\|/.test(activeSource.excerpt); // Numbered table rows

        const isFullEId = activeSource.section_id && (
          activeSource.section_id.includes("__") ||
          activeSource.section_id.startsWith("sec_") ||
          activeSource.section_id.startsWith("part_")
        );

        // Only try section lookup if NOT table data and has a valid eId
        if (activeSource.section_id && isFullEId && !isLikelyTableData) {
          try {
            const section = await getDocumentSection(activeSource.document_id, activeSource.section_id);
            if (cancelled) return;

            // STRICT content matching - require significant overlap
            // Extract first meaningful 80 chars of excerpt (skip brackets/metadata)
            const cleanExcerpt = activeSource.excerpt
              .replace(/^\s*\[.*?\]\s*/g, '') // Remove leading [Schedule:...] etc
              .slice(0, 80)
              .toLowerCase()
              .replace(/\s+/g, ' ')
              .trim();

            const sectionContentLower = (section.content || '').toLowerCase().replace(/\s+/g, ' ');

            // Stricter match: Check if first 40 chars of clean excerpt appear in section content
            // This ensures we're showing the RIGHT section, not just any section with common words
            const excerptSubstring = cleanExcerpt.slice(0, 40);
            const contentMatches = excerptSubstring.length > 10 &&
              sectionContentLower.includes(excerptSubstring);

            if (contentMatches) {
              newSectionData = section;
              if (section.content) newExpandedContent = section.content;
              if (section.html_content) newHtmlContent = section.html_content;

              setContentCache({
                sourceKey,
                expandedContent: newExpandedContent,
                expandedTables: newExpandedTables,
                sectionData: newSectionData,
                htmlContent: newHtmlContent,
                sectionId: null, // Legacy/direct content match doesn't give us ID usually, unless we parse it?
              });
              setIsExpanding(false);
              return;
            }
            // Content doesn't match - fall through to expandSource
          } catch {
            // Fall through to expand-source
          }
        }


        if (cancelled) return;

        try {
          const response = await expandSource(
            activeSource.document_id,
            activeSource.excerpt,
            activeSource.section || undefined,
            activeSource.chunk_id  // Pass chunk_id for precise lookup
          );

          if (cancelled) return;

          if (response.full_excerpt && response.full_excerpt.length > activeSource.excerpt.length) {
            newExpandedContent = response.full_excerpt;
          }
          if (response.tables && response.tables.length > 0) {
            newExpandedTables = response.tables;
          }
          if (response.section_id) {
            newSectionId = response.section_id;
          } else {
          }
        } catch {
        }

        if (!cancelled) {
          setContentCache({
            sourceKey,
            expandedContent: newExpandedContent,
            expandedTables: newExpandedTables,
            sectionData: newSectionData,
            htmlContent: newHtmlContent,
            sectionId: newSectionId,
          });
          setIsExpanding(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Could not expand source:", err);
          setIsExpanding(false);
        }
      }
    };

    fetchContent();

    return () => {
      cancelled = true;
    };
  }, [isPanelOpen, sourceKey, activeSource, contentCache?.sourceKey]);

  if (!activeSource) return null;

  const Icon = documentIconMap[activeSource.document_type] || FileText;
  const colors = getTypeColor(activeSource.document_type);
  const sectionRef = formatSectionFromData(sectionData) || formatSectionRef(activeSource);
  // Always fall back to activeSource.excerpt - this shows immediately without any state reset
  const displayExcerpt = expandedContent || activeSource.excerpt;
  const hasTable = expandedTables.length > 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayExcerpt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Use a simple fixed panel with CSS transitions instead of Sheet animations
  // This prevents re-animation when content changes during navigation
  if (!isPanelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200"
        onClick={closePanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 bg-background border-l shadow-lg flex flex-col"
        style={{ width: `min(100vw, ${panelWidth}px)` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-panel-title"
      >
        {/* Resize handle */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize group hidden sm:flex items-center justify-center",
            "hover:bg-primary/20 active:bg-primary/30 transition-colors",
            isResizing && "bg-primary/30"
          )}
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
          aria-valuenow={panelWidth}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
        >
          <div className={cn(
            "absolute left-0 w-4 h-12 flex items-center justify-center -translate-x-1/2 rounded bg-muted border opacity-0 group-hover:opacity-100 transition-opacity",
            isResizing && "opacity-100"
          )}>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Custom close button */}
        <button
          onClick={closePanel}
          className="absolute top-4 right-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header */}
        <div className="p-4 pb-3 border-b space-y-3">
          <div className="flex items-start gap-3 pr-8">
            <div className={cn("rounded-lg p-2.5", colors.bg, colors.border, "border")}>
              <Icon className={cn("h-5 w-5", colors.icon)} />
            </div>
            <div className="flex-1 min-w-0">
              {sectionRef && (
                <span className="block text-sm font-semibold text-primary mb-0.5">
                  {sectionRef}
                </span>
              )}
              <h2 id="citation-panel-title" className="text-base font-semibold leading-tight line-clamp-2">
                {sectionData?.heading || activeSource.title}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Citation [{activeCitationNumber}] - {activeSource.human_readable_id}
              </p>
            </div>
          </div>

          {/* Navigation */}
          {allSources.length > 1 && (
            <CitationNavigation
              currentIndex={currentIndex}
              totalCount={allSources.length}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onGoToIndex={goToIndex}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              showNumberButtons={allSources.length <= 5}
              compact
            />
          )}
        </div>

        {/* Content - no key prop to prevent unmount/remount flash */}
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="outline" className={cn("capitalize", colors.bg, colors.border, colors.text)}>
                {activeSource.document_type}
              </Badge>
              {activeSource.relevance_score > 0 && (
                <RelevanceIndicator score={activeSource.relevance_score} />
              )}
            </div>

            {/* Content section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {sectionData ? "Section Content" : hasTable ? "Source Data" : "Excerpt"}
                </span>
                <div className="flex items-center gap-1">
                  {(htmlContent || hasTable) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRaw(!showRaw)}
                      className="h-6 px-2 text-xs"
                    >
                      {showRaw ? "Formatted" : "Raw"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 px-2 text-xs"
                    title="Copy excerpt"
                  >
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <CitationExport
                    source={activeSource}
                    sectionRef={sectionRef}
                    className="h-6 px-2 text-xs"
                  />
                </div>
              </div>

              {/* Skeleton loading state - shown while content is loading */}
              {isExpanding && (
                <div className="space-y-4 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading full content...</span>
                  </div>
                  {/* Skeleton placeholder for content */}
                  <div className="rounded-lg border-l-4 border bg-muted/30 p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="pt-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5 mt-2" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </div>
                    <div className="pt-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-2" />
                    </div>
                  </div>
                </div>
              )}

              {/* HTML content */}
              {htmlContent && !showRaw && (
                <div
                  className={cn(
                    "rounded-lg border-l-4 border bg-muted/30 p-4 prose prose-sm max-w-none dark:prose-invert",
                    colors.borderLeft,
                    colors.border
                  )}
                  dangerouslySetInnerHTML={{ __html: sanitizeDocumentHtml(htmlContent) }}
                />
              )}

              {/* Expanded tables */}
              {!htmlContent && expandedTables.length > 0 && !showRaw && (
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


              {/* Plain text - shows immediately with basic excerpt, updates when expanded content loads */}
              {!htmlContent && !showRaw && expandedTables.length === 0 && (
                <div className={cn(
                  "rounded-lg border-l-4 border bg-muted/30 p-4",
                  colors.borderLeft,
                  colors.border
                )}>
                  <HighlightedExcerpt
                    excerpt={displayExcerpt}
                    showQuotes={true}
                    scrollToHighlight={false}
                  />
                </div>
              )}

              {/* Raw content */}
              {showRaw && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {displayExcerpt}
                  </pre>
                </div>
              )}
            </div>

            {/* Related Sources */}
            {allSources.length > 1 && (
              <RelatedSources
                activeSource={activeSource}
                allSources={allSources}
                onSelectSource={goToIndex}
                currentIndex={currentIndex}
                className="pt-2 border-t"
              />
            )}

            {/* Keyboard hints */}
            {allSources.length > 1 && (
              <CitationNavigationHints className="justify-center pt-2" />
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={closePanel}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            {allSources.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleCompareMode}
                className="flex items-center gap-2"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Compare
              </Button>
            )}
            <Button size="sm" asChild>
              <Link
                href={`/document/${activeSource.document_id}${contentCache?.sectionId
                  ? `?section=${contentCache.sectionId}`
                  : activeSource.section_id
                    ? `?section=${activeSource.section_id}`
                    : activeSource.section
                      ? `?sectionTitle=${encodeURIComponent(activeSource.section)}`
                      : ''
                  }`}
                className="flex items-center gap-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Document
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
