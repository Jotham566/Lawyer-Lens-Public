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
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { HighlightedExcerptCompact } from "./highlighted-excerpt";
import { CitationNavigation } from "./citation-navigation";
import { useCitation } from "./citation-context";
import { buildHierarchyPath, parseCitationExcerpt } from "./citation-excerpt-utils";
import type { ChatSource, DocumentType } from "@/lib/api/types";

// Document type utilities
const documentIconMap: Record<DocumentType, LucideIcon> = {
  act: FileText,
  judgment: Gavel,
  regulation: ScrollText,
  constitution: Scale,
};

function getTypeBadgeColor(type: DocumentType) {
  switch (type) {
    case "act":
      return "bg-primary/10 text-primary";
    case "judgment":
      return "bg-secondary text-foreground";
    case "regulation":
      return "bg-muted text-muted-foreground";
    case "constitution":
      return "bg-accent/20 text-primary";
    default:
      return "bg-muted text-muted-foreground";
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

/**
 * Mobile-optimized bottom sheet for viewing citation details.
 * Slides up from bottom on touch devices.
 */
export function SourceBottomSheet() {
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
  } = useCitation();

  const [copied, setCopied] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Reset expanded state when source changes
  React.useEffect(() => {
    setIsExpanded(false);
  }, [activeSource?.document_id]);

  if (!activeSource) return null;

  const Icon = documentIconMap[activeSource.document_type] || FileText;
  const sectionRef = formatSectionRef(activeSource);
  const parsedExcerpt = parseCitationExcerpt(activeSource.excerpt);
  const hierarchyPath = buildHierarchyPath(activeSource);
  const headingHierarchy = hierarchyPath.length > 0
    ? hierarchyPath
    : parsedExcerpt.hierarchyLabel
      ? parsedExcerpt.hierarchyLabel.split(">").map((part) => part.trim()).filter(Boolean)
      : [];

  const handleCopy = async () => {
    const citation = sectionRef
      ? `${sectionRef}, ${activeSource.title}`
      : activeSource.title;
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={isPanelOpen} onOpenChange={(open) => !open && closePanel()}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-2xl border border-border/40 bg-card p-0 [&>button]:hidden",
          isExpanded ? "h-[80vh]" : "h-auto max-h-[60vh]"
        )}
      >
        {/* Accessibility: Title and Description for screen readers */}
        <SheetTitle className="sr-only">
          Citation Details: {activeSource.title}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Viewing citation {activeCitationNumber} - {activeSource.document_type} document
        </SheetDescription>

        {/* Drag handle */}
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn("h-1 w-12", surfaceClasses.dragHandleButton)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          />
        </div>

        {/* Header */}
        <div className="px-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              {headingHierarchy.length > 0 && (
                <p className="text-[10px] leading-snug text-muted-foreground mb-0.5">
                  [{headingHierarchy.join(" > ")}]
                </p>
              )}
              {sectionRef && (
                <span className="block text-xs font-semibold text-primary mb-0.5">
                  {sectionRef}
                </span>
              )}
              <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                {activeSource.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  [{activeCitationNumber}]
                </span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded capitalize",
                  getTypeBadgeColor(activeSource.document_type)
                )}>
                  {activeSource.document_type}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className={cn("h-8 w-8", surfaceClasses.floatingIconButton)}
            >
              <X className="ll-icon-muted h-4 w-4" />
            </button>
          </div>

          {/* Navigation (if multiple sources) */}
          {allSources.length > 1 && (
            <div className="mt-3">
              <CitationNavigation
                currentIndex={currentIndex}
                totalCount={allSources.length}
                onPrevious={goToPrevious}
                onNext={goToNext}
                onGoToIndex={goToIndex}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                compact
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={cn(
          "px-4 py-3 overflow-y-auto",
          isExpanded ? "flex-1" : "max-h-[200px]"
        )}>
          <HighlightedExcerptCompact
            excerpt={parsedExcerpt.bodyText || activeSource.excerpt}
            maxLength={isExpanded ? 0 : 300}
            className="text-sm"
          />

          {isExpanded && parsedExcerpt.tables.length > 0 && (
            <div className="mt-3 space-y-3">
              {parsedExcerpt.tables.map((table, tableIdx) => (
                <div key={tableIdx} className="overflow-x-auto rounded-lg border border-border/30 bg-card/70">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {table.headers.map((header, headerIdx) => (
                          <th key={headerIdx} className="px-2 py-1.5 text-left font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {table.rows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-2 py-1.5 align-top">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {!isExpanded && (parsedExcerpt.bodyText || activeSource.excerpt).length > 300 && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className={cn("mt-2 flex items-center gap-1 text-xs", surfaceClasses.textLink)}
            >
              <ChevronDown className="h-3 w-3" />
              Show more
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-muted/30 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-primary" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          <Button size="sm" asChild className="flex-1">
            <Link href={`/document/${activeSource.document_id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Doc
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Lazy load SourcePanel at module level (NOT inside component) to prevent
// unmount/remount on every re-render. This is critical for smooth navigation.
const LazySourcePanel = React.lazy(() =>
  import("./source-panel").then((mod) => ({ default: mod.SourcePanel }))
);

// Lazy load CitationComparison
const LazyCitationComparison = React.lazy(() =>
  import("./citation-comparison").then((mod) => ({ default: mod.CitationComparison }))
);

/**
 * Responsive wrapper that shows SourcePanel on desktop, SourceBottomSheet on mobile.
 * Also includes the CitationComparison overlay when in compare mode.
 */
export function ResponsiveSourceView() {
  const { isMobile, isCompareMode } = useCitation();

  return (
    <React.Suspense fallback={null}>
      {/* Normal panel/sheet view */}
      {!isCompareMode && (isMobile ? <SourceBottomSheet /> : <LazySourcePanel />)}
      {/* Comparison mode overlay */}
      {isCompareMode && <LazyCitationComparison />}
    </React.Suspense>
  );
}
