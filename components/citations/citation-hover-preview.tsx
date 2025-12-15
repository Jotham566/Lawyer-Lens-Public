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
  PanelRight,
  Table2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { HighlightedExcerptCompact } from "./highlighted-excerpt";
import { useCitationOptional } from "./citation-context";
import type { ChatSource, DocumentType } from "@/lib/api/types";

// Document type utilities
function getDocumentIcon(type: DocumentType) {
  switch (type) {
    case "act": return FileText;
    case "judgment": return Gavel;
    case "regulation": return ScrollText;
    case "constitution": return Scale;
    default: return FileText;
  }
}

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
  children,
  onOpenPanel,
  highlightText,
  className,
}: CitationHoverPreviewProps) {
  const [copied, setCopied] = React.useState(false);
  const citationContext = useCitationOptional();

  const Icon = getDocumentIcon(source.document_type);
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
      citationContext.openPanel(source, citationNumber);
    }
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          onClick={handleOpenPanel}
          className={cn(
            "inline-flex items-center text-primary font-medium hover:underline cursor-pointer",
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
        className="w-[380px] p-0 bg-popover text-popover-foreground border border-border shadow-lg"
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
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="block font-medium text-sm text-foreground leading-tight line-clamp-2">
                {source.title}
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                {source.human_readable_id}
              </span>
            </div>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded capitalize shrink-0",
              getTypeBadgeColor(source.document_type)
            )}>
              {source.document_type}
            </span>
          </div>
        </div>

        <Separator />

        {/* Excerpt preview */}
        <div className="p-3">
          {tableInfo.isTable ? (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
              <Table2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground">
                <span className="font-medium">Table Data</span>
                <span className="text-muted-foreground ml-1">
                  - {tableInfo.rowCount} rows
                </span>
              </span>
            </div>
          ) : (
            <HighlightedExcerptCompact
              excerpt={source.excerpt}
              highlightText={highlightText}
              maxLength={250}
              className="text-foreground/80"
            />
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-2 flex items-center justify-between gap-2 bg-muted/30">
          <div className="flex items-center gap-1">
            {/* Copy */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
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
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
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
            className="h-7 px-2 text-xs text-primary hover:text-primary"
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
