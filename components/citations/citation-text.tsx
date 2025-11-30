"use client";

import * as React from "react";
import { CitationLink } from "./citation-link";
import { parseCitations, type ParsedCitation } from "@/lib/utils/citation-parser";

interface CitationTextProps {
  /** The text content that may contain citations */
  text: string;
  /** The document ID to link citations to (required for hover previews) */
  documentId?: string;
  /** Document title for context in hover cards */
  documentTitle?: string;
  /** Whether to enable hover previews (requires documentId) */
  enablePreviews?: boolean;
  /** Optional class name */
  className?: string;
}

/**
 * CitationText - Renders text with automatically detected and linked citations
 *
 * Parses the text for legal citations (e.g., "Section 19(2)", "s. 19(2)(a)")
 * and renders them as interactive links with hover previews showing the actual
 * section content from the document's AKN XML.
 *
 * If no documentId is provided, citations are highlighted but not interactive.
 */
export function CitationText({
  text,
  documentId,
  documentTitle,
  enablePreviews = true,
  className,
}: CitationTextProps) {
  const parsedCitations = React.useMemo(() => parseCitations(text), [text]);

  // If no citations found, just return the text
  if (parsedCitations.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Build segments of text and citations
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  parsedCitations.forEach((citation, index) => {
    // Add text before this citation
    if (citation.start > lastIndex) {
      segments.push(
        <span key={`text-${index}`}>{text.slice(lastIndex, citation.start)}</span>
      );
    }

    // Add the citation
    if (documentId && enablePreviews) {
      segments.push(
        <CitationLink
          key={`citation-${index}`}
          documentId={documentId}
          eId={citation.eId}
          documentTitle={documentTitle}
        >
          {citation.text}
        </CitationLink>
      );
    } else {
      // Non-interactive highlighted citation
      segments.push(
        <span
          key={`citation-${index}`}
          className="text-primary font-medium"
          title={`Citation: ${citation.eId}`}
        >
          {citation.text}
        </span>
      );
    }

    lastIndex = citation.end;
  });

  // Add remaining text after last citation
  if (lastIndex < text.length) {
    segments.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return <span className={className}>{segments}</span>;
}

/**
 * useCitationParser - Hook for parsing citations from text
 *
 * Returns the parsed citations and helper methods.
 */
export function useCitationParser(text: string) {
  const citations = React.useMemo(() => parseCitations(text), [text]);

  return {
    citations,
    hasCitations: citations.length > 0,
    uniqueEIds: [...new Set(citations.map((c) => c.eId))],
  };
}

export type { ParsedCitation };
