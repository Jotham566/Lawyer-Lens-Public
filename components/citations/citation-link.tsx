"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDocumentSection } from "@/lib/api";
import { eIdToCitation } from "@/lib/utils/citation-parser";
import type { SectionResponse } from "@/lib/api/types";

interface CitationLinkProps {
  /** The document ID (UUID) */
  documentId: string;
  /** The AKN element ID (e.g., "sec_19__subsec_2") */
  eId: string;
  /** The display text for the citation */
  children: React.ReactNode;
  /** Document title for context */
  documentTitle?: string;
  /** Optional class name */
  className?: string;
  /** Whether to show the full document link */
  showDocumentLink?: boolean;
}

/**
 * CitationLink - An interactive citation that shows section content on hover
 *
 * When a user hovers over a citation like "Section 19(2)", this component
 * fetches and displays the actual section content from the document's AKN XML.
 */
export function CitationLink({
  documentId,
  eId,
  children,
  documentTitle,
  className,
  showDocumentLink = true,
}: CitationLinkProps) {
  const [section, setSection] = React.useState<SectionResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = React.useState(false);

  const fetchSection = React.useCallback(async () => {
    if (hasAttemptedFetch || loading) return;

    setLoading(true);
    setError(null);
    setHasAttemptedFetch(true);

    try {
      const data = await getDocumentSection(documentId, eId);
      setSection(data);
    } catch (err) {
      console.error("Failed to fetch section:", err);
      setError("Could not load section content");
    } finally {
      setLoading(false);
    }
  }, [documentId, eId, hasAttemptedFetch, loading]);

  const handleOpenChange = (open: boolean) => {
    if (open && !hasAttemptedFetch) {
      fetchSection();
    }
  };

  // Generate human-readable citation from eId
  const readableCitation = eIdToCitation(eId);

  // Truncate content for preview
  const truncatedContent = section?.content
    ? section.content.length > 500
      ? section.content.slice(0, 500) + "..."
      : section.content
    : null;

  return (
    <HoverCard openDelay={300} closeDelay={100} onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild>
        <button
          className={`cursor-pointer text-primary underline decoration-dotted underline-offset-2 hover:decoration-solid ${className || ""}`}
        >
          {children}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-96 p-0"
        side="top"
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="border-b bg-muted/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{readableCitation}</span>
              </div>
              {section && (
                <Badge variant="outline" className="text-xs">
                  {section.section_type}
                </Badge>
              )}
            </div>
            {documentTitle && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                {documentTitle}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading section...
                </span>
              </div>
            )}

            {error && (
              <div className="py-2 text-sm text-destructive">{error}</div>
            )}

            {section && !loading && (
              <>
                {section.heading && (
                  <p className="mb-2 font-medium text-sm">{section.heading}</p>
                )}
                <ScrollArea className="max-h-48">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {truncatedContent}
                  </p>
                </ScrollArea>

                {/* Children indicator */}
                {section.children_eids.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Contains {section.children_eids.length} sub-section
                    {section.children_eids.length > 1 ? "s" : ""}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer with link to document */}
          {showDocumentLink && section && !loading && (
            <div className="border-t bg-muted/30 px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-full text-xs"
              >
                <Link
                  href={`/documents/${documentId}#${eId}`}
                  className="flex items-center justify-center gap-1"
                >
                  View in document
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
