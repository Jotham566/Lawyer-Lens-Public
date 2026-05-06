"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Scale,
  Gavel,
  ScrollText,
  Lock,
  Copy,
  Check,
  ExternalLink,
  PanelRight,
  Table2,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getDocumentAccentClass, getDocumentBadgeVariant, getDocumentRailClass, getDocumentTypeLabel, surfaceClasses } from "@/lib/design-system";
import { HighlightedExcerptCompact } from "./highlighted-excerpt";
import { useCitationOptional } from "./citation-context";
import type { ChatSource, DocumentType } from "@/lib/api/types";

// Document type utilities
const documentIconMap: Record<DocumentType, LucideIcon> = {
  act: FileText,
  judgment: Gavel,
  regulation: ScrollText,
  constitution: Scale,
  organization_document: Lock,
};

// Detect if text contains table data
function detectTableInfo(text: string): { isTable: boolean; rowCount: number } {
  const pipeCount = (text.match(/\|/g) || []).length;
  if (pipeCount < 2) return { isTable: false, rowCount: 0 };

  const lines = text.split(/\n/).filter(line => line.trim() && line.includes('|'));
  if (lines.length >= 2) {
    return { isTable: true, rowCount: lines.length };
  }

  const numberedPattern = /\d+\.?\s*\|/g;
  const numberedMatches = text.match(numberedPattern);
  if (numberedMatches && numberedMatches.length >= 2) {
    return { isTable: true, rowCount: numberedMatches.length };
  }

  return { isTable: false, rowCount: 0 };
}

// Format section reference
function formatSectionRef(source: ChatSource): string | null {
  if (source.legal_reference) return source.legal_reference;

  const section = source.section;
  const sectionId = source.section_id;

  for (const input of [section, sectionId]) {
    if (!input) continue;

    // Pattern: "Section X" or "Section X(Y)"
    const sectionMatch = input.match(/(Section\s+\d+(?:\s*\([^)]+\))?)/i);
    if (sectionMatch) return sectionMatch[1];

    // Pattern: "X. Title"
    const numberedMatch = input.match(/^(\d+)\.\s/);
    if (numberedMatch) return `Section ${numberedMatch[1]}`;

    // Pattern: section_id format like "sec_11"
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

interface CitationHoverPreviewProps {
  /** The citation number (1-indexed) */
  citationNumber: number;
  /** The source data */
  source: ChatSource;
  /** All sources in the current message (for context) */
  sources: ChatSource[];
  /** Child elements (the citation text like [1]) */
  children: React.ReactNode;
  /** Callback when "View in Panel" is clicked */
  onOpenPanel?: () => void;
  /** Optional highlighted text within the excerpt */
  highlightText?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Enhanced hover preview for citations.
 * Shows source details with actions in a persistent HoverCard.
 */
export function CitationHoverPreview({
  citationNumber,
  source,
  sources,
  children,
  onOpenPanel,
  highlightText,
  className,
}: CitationHoverPreviewProps) {
  const [copied, setCopied] = React.useState(false);
  const citationContext = useCitationOptional();

  const Icon = documentIconMap[source.document_type] || FileText;
  const sectionRef = formatSectionRef(source);
  const tableInfo = detectTableInfo(source.excerpt);

  // Copy citation to clipboard
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const citation = sectionRef
      ? `${sectionRef}, ${source.title}`
      : source.title;
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open in panel
  const handleOpenPanel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenPanel) {
      onOpenPanel();
    } else if (citationContext) {
      // Pass sources to avoid stale closure issues
      citationContext.openPanel(source, citationNumber, sources);
    }
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          onClick={handleOpenPanel}
          className={cn(
            "ll-inline-citation-button inline-flex items-center gap-0.5 underline-offset-4",
            className
          )}
          aria-label={`Citation ${citationNumber}, ${source.title}`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="w-[380px] border border-border/80 bg-background p-0 text-foreground shadow-floating"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-3 space-y-2">
          {/* Section reference */}
          {sectionRef && (
            <span className="block text-xs font-semibold text-primary">
              {sectionRef}
            </span>
          )}

          {/* Document info */}
          <div className="flex items-start gap-2">
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", getDocumentAccentClass(source.document_type))} />
            <div className="flex-1 min-w-0">
              <span className="block font-medium text-sm text-foreground leading-tight line-clamp-2">
                {source.title}
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                {source.human_readable_id}
              </span>
            </div>
            <Badge
              variant={getDocumentBadgeVariant(source.document_type)}
              className="shrink-0 px-1.5 py-0 text-[10px] tracking-[0.04em]"
            >
              {getDocumentTypeLabel(source.document_type)}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Excerpt preview */}
        <div className="bg-background p-3">
          {tableInfo.isTable ? (
            <div className={cn(
              "flex items-center gap-2 rounded-md border border-border/50 bg-surface-container-low p-2 border-l-4",
              getDocumentRailClass(source.document_type)
            )}>
              <Table2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground">
                <span className="font-medium">Table Data</span>
                <span className="text-muted-foreground ml-1">
                  - {tableInfo.rowCount} rows
                </span>
              </span>
            </div>
          ) : (
            <div className={cn(
              "rounded-md border border-border/50 border-l-4 bg-surface-container-low p-2",
              getDocumentRailClass(source.document_type)
            )}>
              <HighlightedExcerptCompact
                excerpt={source.excerpt}
                highlightText={highlightText}
                maxLength={250}
                className="text-foreground"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 bg-surface-container-low p-2">
          <div className="flex items-center gap-1">
            {/* Copy */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className={cn("h-7 px-2 text-xs", surfaceClasses.iconButton)}
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5 text-primary" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </>
              )}
            </Button>

            {/* View in Panel */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenPanel}
              className={cn("h-7 px-2 text-xs", surfaceClasses.iconButton)}
            >
              <PanelRight className="h-3.5 w-3.5 mr-1" />
              Panel
            </Button>
          </div>

          {/* Open Document */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn("h-7 px-2 text-xs text-primary", surfaceClasses.iconButton)}
          >
            <Link href={`/document/${source.document_id}`}>
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Open Doc
            </Link>
          </Button>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
