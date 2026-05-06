"use client";

import { X, FileText, Scale, Gavel, ScrollText, ArrowLeftRight, Lock, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDocumentTypeLabel, surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { HighlightedExcerpt } from "./highlighted-excerpt";
import { useCitation } from "./citation-context";
import type { ChatSource, DocumentType } from "@/lib/api/types";

// Document type utilities (shared with source-panel)
const documentIconMap: Record<DocumentType, LucideIcon> = {
  act: FileText,
  judgment: Gavel,
  regulation: ScrollText,
  constitution: Scale,
  // Internal KB docs get Lock to mark "your private corpus".
  organization_document: Lock,
};

function getTypeColor(type: DocumentType) {
  switch (type) {
    case "act":
      return {
        bg: "bg-primary/10",
        border: "border-border/30",
        text: "text-primary",
        icon: "text-primary",
      };
    case "judgment":
      return {
        bg: "bg-secondary",
        border: "border-border/30",
        text: "text-foreground",
        icon: "text-foreground",
      };
    case "regulation":
      return {
        bg: "bg-muted",
        border: "border-border/30",
        text: "text-muted-foreground",
        icon: "text-muted-foreground",
      };
    case "constitution":
      return {
        bg: "bg-accent/20",
        border: "border-border/30",
        text: "text-primary",
        icon: "text-primary",
      };
    case "organization_document":
      return {
        bg: "bg-blue-500/10 dark:bg-blue-500/15",
        border: "border-blue-500/30",
        text: "text-blue-700 dark:text-blue-300",
        icon: "text-blue-600 dark:text-blue-400",
      };
    default:
      return {
        bg: "bg-muted",
        border: "border-border/30",
        text: "text-muted-foreground",
        icon: "text-muted-foreground",
      };
  }
}

interface ComparisonCardProps {
  source: ChatSource;
  citationNumber: number;
  onRemove: () => void;
}

function ComparisonCard({ source, citationNumber, onRemove }: ComparisonCardProps) {
  const Icon = documentIconMap[source.document_type] || FileText;
  const colors = getTypeColor(source.document_type);

  const sectionRef = source.legal_reference || source.section || null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border/30 bg-card">
      {/* Header */}
      <div className="border-b border-border/30 bg-muted/30 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className={cn("flex-shrink-0 rounded p-1.5 border", colors.bg, colors.border)}>
              <Icon className={cn("h-4 w-4", colors.icon)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                  {citationNumber}
                </span>
                <Badge variant="outline" className={cn("text-xs", colors.bg, colors.border, colors.text)}>
                  {getDocumentTypeLabel(source.document_type)}
                </Badge>
              </div>
              {sectionRef && (
                <p className="text-sm font-medium text-primary mt-1 truncate">{sectionRef}</p>
              )}
              <p className="text-sm font-semibold truncate mt-0.5">{source.title}</p>
              <p className="text-xs text-muted-foreground truncate">{source.human_readable_id}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-3">
        <div className="rounded-lg border border-border/30 bg-muted/30 p-3">
          <HighlightedExcerpt
            excerpt={source.excerpt}
            showQuotes={true}
            scrollToHighlight={false}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

interface EmptySlotProps {
  slotNumber: 1 | 2;
}

function EmptySlot({ slotNumber }: EmptySlotProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border/40 bg-muted/10 p-6 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <span className="text-lg font-medium text-muted-foreground">{slotNumber}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Select citation {slotNumber} to compare
      </p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Click a citation number below
      </p>
    </div>
  );
}

/**
 * Multi-Citation Comparison View
 * Shows two citations side-by-side for comparison
 */
export function CitationComparison() {
  const {
    isCompareMode,
    selectedForCompare,
    allSources,
    toggleCompareMode,
    toggleCompareSelection,
    clearCompareSelection,
  } = useCitation();

  if (!isCompareMode) return null;

  const source1 = selectedForCompare[0] !== undefined ? allSources[selectedForCompare[0]] : null;
  const source2 = selectedForCompare[1] !== undefined ? allSources[selectedForCompare[1]] : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="ll-overlay-scrim fixed inset-0 z-40 transition-opacity duration-200"
        onClick={toggleCompareMode}
        aria-hidden="true"
      />

      {/* Comparison Panel */}
      <div
        className="ll-slide-panel fixed inset-y-0 right-0 z-50 flex w-full flex-col sm:w-[90vw] md:w-[800px] lg:w-[900px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/30 p-4">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <div>
              <h2 id="comparison-panel-title" className="font-semibold">Compare Citations</h2>
              <p className="text-xs text-muted-foreground">
                {selectedForCompare.length === 0
                  ? "Select two citations to compare"
                  : selectedForCompare.length === 1
                  ? "Select one more citation"
                  : "Comparing 2 citations"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedForCompare.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompareSelection}
                className="text-xs"
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCompareMode}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comparison Area */}
        <div className="flex-1 p-4 grid grid-cols-2 gap-4 min-h-0">
          <div className="min-h-0">
            {source1 ? (
              <ComparisonCard
                source={source1}
                citationNumber={selectedForCompare[0] + 1}
                onRemove={() => toggleCompareSelection(selectedForCompare[0])}
              />
            ) : (
              <EmptySlot slotNumber={1} />
            )}
          </div>
          <div className="min-h-0">
            {source2 ? (
              <ComparisonCard
                source={source2}
                citationNumber={selectedForCompare[1] + 1}
                onRemove={() => toggleCompareSelection(selectedForCompare[1])}
              />
            ) : (
              <EmptySlot slotNumber={2} />
            )}
          </div>
        </div>

        {/* Source Selection */}
        <div className="border-t border-border/30 bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Select citations to compare:
          </p>
          <div className="flex flex-wrap gap-2">
            {allSources.map((source, index) => {
              const isSelected = selectedForCompare.includes(index);
              const Icon = documentIconMap[source.document_type];
              const colors = getTypeColor(source.document_type);

              return (
                <button
                  key={`${source.document_id}-${source.section_id}-${index}`}
                  type="button"
                  onClick={() => toggleCompareSelection(index)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm",
                    isSelected
                      ? surfaceClasses.optionCardActive
                      : surfaceClasses.optionCard
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded flex items-center justify-center text-xs font-medium",
                    isSelected ? "bg-primary-foreground/20" : cn(colors.bg, colors.text)
                  )}>
                    {index + 1}
                  </span>
                  <Icon className={cn("h-3.5 w-3.5", isSelected ? "" : colors.icon)} />
                  <span className="truncate max-w-32">
                    {source.legal_reference || source.section || source.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
