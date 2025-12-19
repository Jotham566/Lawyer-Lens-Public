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
import { cn } from "@/lib/utils";
import { HighlightedExcerptCompact } from "./highlighted-excerpt";
import { CitationNavigation } from "./citation-navigation";
import { useCitation } from "./citation-context";
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
          "p-0 rounded-t-2xl [&>button]:hidden",
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
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-1 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b">
          <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
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
              onClick={closePanel}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
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
            excerpt={activeSource.excerpt}
            maxLength={isExpanded ? 0 : 300}
            className="text-sm"
          />

          {!isExpanded && activeSource.excerpt.length > 300 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1 mt-2 text-xs text-primary font-medium"
            >
              <ChevronDown className="h-3 w-3" />
              Show more
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t bg-muted/30 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-500" />
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
