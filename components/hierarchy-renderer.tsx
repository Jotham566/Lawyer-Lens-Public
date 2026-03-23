"use client";

import * as React from "react";
import { Check, Link2 } from "lucide-react";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { HierarchicalNode, TextFragment } from "@/lib/api/types";
import { SaveToCollectionButton } from "@/components/collections/save-to-collection-button";


interface HierarchyRendererProps {
  node: HierarchicalNode;
  document?: {
    title?: string;
    short_title?: string;
    jurisdiction?: string;
    act_year?: number;
    chapter?: string;
    publication_date?: string;
    commencement_date?: string;
  };
  fontSize?: "small" | "medium" | "large";
  highlightedSectionId?: string | null;
  showDocumentHeader?: boolean;
  className?: string;
  documentId?: string;
}

// Context for passing highlight state and document ID down
const HighlightContext = React.createContext<string | null>(null);
interface DocumentContextType {
  documentId: string | null;
  documentTitle?: string;
  documentShortTitle?: string;
}
const DocumentContext = React.createContext<DocumentContextType>({ documentId: null });

// Context for tracking ancestor path (for building full hierarchical labels)
interface AncestorInfo {
  type: string;
  identifier?: string;
  title?: string;
}
const AncestorPathContext = React.createContext<AncestorInfo[]>([]);

type KatexLike = {
  renderToString: (
    tex: string,
    options?: Record<string, unknown>
  ) => string;
};

type MathSegment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; display: boolean };

function parseMathSegments(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const displayStart = remaining.indexOf("$$");
    const inlineStart = remaining.indexOf("$");

    let startIdx = -1;
    let display = false;

    if (displayStart !== -1 && (inlineStart === -1 || displayStart <= inlineStart)) {
      startIdx = displayStart;
      display = true;
    } else if (inlineStart !== -1) {
      if (remaining[inlineStart + 1] === "$") {
        startIdx = displayStart;
        display = true;
      } else {
        startIdx = inlineStart;
        display = false;
      }
    }

    if (startIdx === -1) {
      segments.push({ type: "text", value: remaining });
      break;
    }

    if (startIdx > 0) {
      segments.push({ type: "text", value: remaining.slice(0, startIdx) });
    }

    const delimiter = display ? "$$" : "$";
    const searchStart = startIdx + delimiter.length;
    let endIdx = remaining.indexOf(delimiter, searchStart);

    if (!display) {
      while (endIdx !== -1 && remaining[endIdx + 1] === "$") {
        endIdx = remaining.indexOf(delimiter, endIdx + 2);
      }
    }

    if (endIdx === -1) {
      segments.push({ type: "text", value: remaining.slice(startIdx) });
      break;
    }

    segments.push({
      type: "math",
      value: remaining.slice(searchStart, endIdx).trim(),
      display,
    });

    remaining = remaining.slice(endIdx + delimiter.length);
  }

  return segments.filter((segment) => segment.type === "math" || segment.value.length > 0);
}

function MathText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [katex, setKatex] = React.useState<KatexLike | null>(null);

  React.useEffect(() => {
    if (!text.includes("$")) return;

    let cancelled = false;
    void (async () => {
      const { default: loadedKatex } = await import("katex");
      if (!cancelled) {
        setKatex(loadedKatex as KatexLike);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!text.includes("$")) {
    return <>{text}</>;
  }

  const segments = parseMathSegments(text);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <React.Fragment key={index}>{segment.value}</React.Fragment>;
        }

        if (!katex) {
          return (
            <React.Fragment key={index}>
              {segment.display ? `$$${segment.value}$$` : `$${segment.value}$`}
            </React.Fragment>
          );
        }

        try {
          const html = katex.renderToString(segment.value, {
            displayMode: segment.display,
            throwOnError: false,
            strict: false,
          });

          if (segment.display) {
            return (
              <span
                key={index}
                className="my-4 block overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return (
            <React.Fragment key={index}>
              {segment.display ? `$$${segment.value}$$` : `$${segment.value}$`}
            </React.Fragment>
          );
        }
      })}
    </span>
  );
}

/**
 * Hierarchical Structure Renderer
 *
 * Renders the hierarchical_structure JSON with proper legal document styling.
 * Uses the actual document metadata for accurate header information.
 */
export function HierarchyRenderer({
  node,
  document,
  fontSize = "medium",
  highlightedSectionId = null,
  showDocumentHeader = true,
  className,
  documentId,
}: HierarchyRendererProps) {
  return (
    <DocumentContext.Provider value={{
      documentId: documentId || null,
      documentTitle: document?.title,
      documentShortTitle: document?.short_title,
    }}>
      <HighlightContext.Provider value={highlightedSectionId}>
        <div
          className={cn(
            "hierarchy-document leading-relaxed",
            fontSize === "small" && "text-sm",
            fontSize === "medium" && "text-base",
            fontSize === "large" && "text-lg",
            className
          )}
        >
          {/* Optional in-page header (can be disabled when page already has a hero/header) */}
          {showDocumentHeader && document && <DocumentHeader document={document} />}

          {/* Document Body */}
          <div className="hierarchy-body">
            {node.children?.map((child, index) => (
              <RenderNode key={index} node={child} depth={0} />
            ))}
          </div>
        </div>
      </HighlightContext.Provider>
    </DocumentContext.Provider>
  );
}

function NodeSaveButton({ node, className }: { node: HierarchicalNode; className?: string }) {
  const { documentId, documentTitle, documentShortTitle } = React.useContext(DocumentContext) || {};
  const ancestorPath = React.useContext(AncestorPathContext);
  const [copied, setCopied] = React.useState(false);

  if (!documentId) return null;

  // Use the same ID generation as the DOM element for scroll linking
  const sectionId = getNodeId(node);
  const itemType = "section";

  // Build full hierarchical path label
  // Format: "Document Title - Part II Section 3(2)(a). Title"
  const formatAncestor = (a: AncestorInfo): string => {
    const typeLabel = a.type.charAt(0).toUpperCase() + a.type.slice(1);
    // For parts, use "Part II" format; for sections use "Section 3" etc.
    if (a.type === 'part') return `Part ${a.identifier || ''}`;
    if (a.type === 'chapter') return `Chapter ${a.identifier || ''}`;
    if (a.type === 'section') return `Section ${a.identifier || ''}`;
    if (a.type === 'subsection') return `(${a.identifier || ''})`;
    if (a.type === 'paragraph') return `(${a.identifier || ''})`;
    if (a.type === 'subparagraph') return `(${a.identifier || ''})`;
    return `${typeLabel} ${a.identifier || ''}`;
  };

  // Format the current node
  const formatCurrentNode = (): string => {
    const type = node.type?.toLowerCase() || '';
    if (type === 'part') return `Part ${node.identifier || ''}`;
    if (type === 'chapter') return `Chapter ${node.identifier || ''}`;
    if (type === 'section') return `Section ${node.identifier || ''}`;
    if (type === 'subsection') return `(${node.identifier || ''})`;
    if (type === 'paragraph') return `(${node.identifier || ''})`;
    if (type === 'subparagraph') return `(${node.identifier || ''})`;
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    return `${typeLabel} ${node.identifier || ''}`;
  };

  // Build path: ancestors + current node
  const pathParts: string[] = [];

  // Add ancestors (skip connecting between section and subsection with space)
  for (let i = 0; i < ancestorPath.length; i++) {
    const a = ancestorPath[i];
    const formatted = formatAncestor(a);
    if (pathParts.length > 0) {
      const prev = ancestorPath[i - 1]?.type;
      // If we're transitioning from section-level to sub-level, don't add space
      if (['subsection', 'paragraph', 'subparagraph'].includes(a.type) &&
        ['section', 'subsection', 'paragraph'].includes(prev || '')) {
        // Append without separator
        pathParts[pathParts.length - 1] += formatted;
      } else {
        pathParts.push(formatted);
      }
    } else {
      pathParts.push(formatted);
    }
  }

  // Add current node
  const currentFormatted = formatCurrentNode();
  if (pathParts.length > 0) {
    const lastAncestorType = ancestorPath[ancestorPath.length - 1]?.type;
    const currentType = node.type?.toLowerCase() || '';
    // If transitioning to sub-level, concatenate
    if (['subsection', 'paragraph', 'subparagraph'].includes(currentType) &&
      ['section', 'subsection', 'paragraph'].includes(lastAncestorType || '')) {
      pathParts[pathParts.length - 1] += currentFormatted;
    } else {
      pathParts.push(currentFormatted);
    }
  } else {
    pathParts.push(currentFormatted);
  }

  // Join with spaces
  const hierarchicalPath = pathParts.join(' ');

  // Add title if present
  const fullLabel = node.title
    ? `${hierarchicalPath}. ${node.title}`
    : hierarchicalPath;

  const docName = documentShortTitle || documentTitle || '';
  const snippetLabel = docName ? `${docName} - ${fullLabel}` : fullLabel;

  const handleCopySectionLink = async () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.hash = sectionId;
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // no-op: clipboard may be unavailable in some contexts
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 text-muted-foreground opacity-0 transition-opacity group-hover/node:opacity-70 hover:opacity-100 focus-within:opacity-100",
        className
      )}
    >
      <button
        type="button"
        onClick={handleCopySectionLink}
        className={cn("inline-flex h-5 w-5 items-center justify-center", surfaceClasses.iconButton)}
        aria-label="Copy section link"
        title="Copy section link"
      >
        {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
      </button>
      <SaveToCollectionButton
        documentId={documentId}
        sectionId={sectionId}
        itemType={itemType}
        meta={{
          snippet_label: snippetLabel,
          section_title: node.title,
          section_identifier: node.identifier,
          section_type: node.type,
          hierarchical_path: hierarchicalPath,
        }}
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        showLabel={false}
      />
    </div>
  );
}

// ============ Document Header ============

function DocumentHeader({
  document,
}: {
  document: NonNullable<HierarchyRendererProps["document"]>;
}) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="text-center mb-8 pb-6 border-b border-border">
      {document.jurisdiction && (
        <div className="text-lg font-semibold mb-2">
          {document.jurisdiction === "UG" ? "Uganda" : document.jurisdiction}
        </div>
      )}
      {document.title && (
        <h1 className="text-2xl font-bold mb-2">{document.title}</h1>
      )}
      {document.short_title && document.short_title !== document.title && (
        <div className="text-lg mb-3">{document.short_title}</div>
      )}
      {document.chapter && (
        <div className="text-base font-medium mb-3">
          Chapter {document.chapter}
        </div>
      )}
      {document.publication_date && (
        <div className="text-sm text-muted-foreground mb-1">
          Published on {formatDate(document.publication_date)}
        </div>
      )}
      {document.commencement_date && (
        <div className="text-sm mb-2">
          Commenced on {formatDate(document.commencement_date)}
        </div>
      )}
      {document.act_year && (
        <div className="text-sm text-muted-foreground mt-3 italic">
          [Act {document.act_year}]
        </div>
      )}
    </header>
  );
}

// ============ Helper Functions ============

/**
 * Generate an ID for ToC linking
 */
function getNodeId(node: HierarchicalNode): string {
  if (node.akn_eid) return node.akn_eid;
  const type = node.type?.toLowerCase() || "node";
  return `${type}-${node.identifier || "unknown"}`;
}

// ============ Node Renderer ============

interface RenderNodeProps {
  node: HierarchicalNode;
  depth: number;
}

function RenderNode({ node, depth }: RenderNodeProps) {
  const type = node.type?.toLowerCase() || "unknown";

  switch (type) {
    case "part":
      return <Part node={node} />;
    case "chapter":
      return <Chapter node={node} />;
    case "section":
      return <Section node={node} />;
    case "subsection":
      return <Subsection node={node} />;
    case "paragraph":
      return <Paragraph node={node} />;
    case "subparagraph":
      return <Subparagraph node={node} />;
    case "schedule":
      return <Schedule node={node} />;
    case "article":
      return <Article node={node} />;
    default:
      return <GenericNode node={node} depth={depth} />;
  }
}

// ============ Structural Components ============

function Part({ node }: { node: HierarchicalNode }) {
  const id = getNodeId(node);
  const highlightedId = React.useContext(HighlightContext);
  const isHighlighted = highlightedId === id;
  return (
    <section
      id={id}
      data-toc-id={id}
      className={cn(
        "mt-10 first:mt-0 scroll-mt-4 group/node relative",
        isHighlighted && "section-highlighted"
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-6">
        <h2 className="text-center font-bold text-lg">
          {node.identifier && <span>PART {node.identifier}</span>}
          {node.identifier && node.title && <span> – </span>}
          {node.title && <span>{node.title}</span>}
        </h2>
        <NodeSaveButton node={node} />
      </div>
      <NodeContent node={node} />
      <NodeTables node={node} />
      <NodeChildren node={node} />
    </section>
  );
}

function Chapter({ node }: { node: HierarchicalNode }) {
  const id = getNodeId(node);
  const highlightedId = React.useContext(HighlightContext);
  const isHighlighted = highlightedId === id;
  return (
    <section
      id={id}
      data-toc-id={id}
      className={cn(
        "mt-8 scroll-mt-4 group/node relative",
        isHighlighted && "section-highlighted"
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <h3 className="text-center font-bold">
          {node.identifier && <span>Chapter {node.identifier}</span>}
          {node.identifier && node.title && <span> – </span>}
          {node.title && <span>{node.title}</span>}
        </h3>
        <NodeSaveButton node={node} />
      </div>
      <NodeContent node={node} />
      <NodeTables node={node} />
      <NodeChildren node={node} />
    </section>
  );
}

function Section({ node }: { node: HierarchicalNode }) {
  const id = getNodeId(node);
  const highlightedId = React.useContext(HighlightContext);
  const isHighlighted = highlightedId === id;
  return (
    <section
      id={id}
      data-toc-id={id}
      data-section-title={node.title || node.identifier}
      className={cn(
        "mt-6 scroll-mt-4 group/node relative",
        isHighlighted && "section-highlighted"
      )}
    >
      <div className="font-bold mb-2 flex items-center gap-2">
        <span>
          {node.identifier && <span>{node.identifier}. </span>}
          {node.title && <span>{node.title}</span>}
        </span>
        <NodeSaveButton node={node} />
      </div>
      <NodeContent node={node} />
      <NodeTables node={node} />
      <NodeChildren node={node} />
    </section>
  );
}

function Subsection({ node }: { node: HierarchicalNode }) {
  const id = getNodeId(node);
  const highlightedId = React.useContext(HighlightContext);
  const isHighlighted = highlightedId === id;

  return (
    <div
      id={id}
      data-section-title={node.title || node.identifier}
      className={cn(
        "flex mt-2 scroll-mt-24 group/node relative", // Increased scroll margin for sticky header safety
        isHighlighted && "section-highlighted"
      )}
    >
      <div className="w-12 flex-shrink-0 flex items-start gap-1.5">
        {node.identifier && <span>({node.identifier})</span>}
      </div>
      <div className="flex-1 min-w-0">
        {node.title && (
          <div className="mb-1 whitespace-pre-wrap">
            <MathText text={node.title} />
          </div>
        )}
        <NodeContent node={node} />
        <NodeTables node={node} />
        <NodeChildren node={node} />
      </div>
    </div>
  );
}

function Paragraph({ node }: { node: HierarchicalNode }) {
  const id = getNodeId(node);
  const highlightedId = React.useContext(HighlightContext);
  const isHighlighted = highlightedId === id;

  return (
    <div
      id={id}
      data-section-title={node.title || node.identifier}
      className={cn(
        "flex mt-1.5 ml-10 scroll-mt-24",
        isHighlighted && "section-highlighted"
      )}
    >
      <div className="w-8 flex-shrink-0">
        {node.identifier && <span>({node.identifier})</span>}
      </div>
      <div className="flex-1 min-w-0">
        {node.title && (
          <div className="mb-1 whitespace-pre-wrap">
            <MathText text={node.title} />
          </div>
        )}
        <NodeContent node={node} />
        <NodeTables node={node} />
        <NodeChildren node={node} />
      </div>
    </div>
  );
}

function Subparagraph({ node }: { node: HierarchicalNode }) {
  const id = getNodeId(node);
  const highlightedId = React.useContext(HighlightContext);
  const isHighlighted = highlightedId === id;

  return (
    <div
      id={id}
      data-section-title={node.title || node.identifier}
      className={cn(
        "flex mt-1 ml-8 scroll-mt-24",
        isHighlighted && "section-highlighted"
      )}
    >
      <div className="w-8 flex-shrink-0">
        {node.identifier && <span>({node.identifier})</span>}
      </div>
      <div className="flex-1 min-w-0">
        {node.title && (
          <div className="mb-1 whitespace-pre-wrap">
            <MathText text={node.title} />
          </div>
        )}
        <NodeContent node={node} />
        <NodeTables node={node} />
        <NodeChildren node={node} />
      </div>
    </div>
  );
}

function Schedule({ node }: { node: HierarchicalNode }) {
  const id = getNodeId(node);
  const highlightedId = React.useContext(HighlightContext);
  const isHighlighted = highlightedId === id;
  return (
    <section
      id={id}
      data-toc-id={id}
      className={cn(
        "mt-10 pt-8 border-t-2 border-border scroll-mt-4",
        isHighlighted && "section-highlighted"
      )}
    >
      <h2 className="text-center font-bold text-lg mb-6">
        {node.identifier && <span>Schedule {node.identifier}</span>}
        {node.identifier && node.title && <span> – </span>}
        {node.title && <span>{node.title}</span>}
      </h2>
      <NodeContent node={node} />
      <NodeTables node={node} />
      <NodeChildren node={node} />
    </section>
  );
}

function Article({ node }: { node: HierarchicalNode }) {
  const id = getNodeId(node);
  const highlightedId = React.useContext(HighlightContext);
  const isHighlighted = highlightedId === id;
  return (
    <section
      id={id}
      data-toc-id={id}
      className={cn(
        "mt-6 scroll-mt-4",
        isHighlighted && "section-highlighted"
      )}
    >
      <div className="font-bold mb-2">
        {node.identifier && <span>Article {node.identifier}. </span>}
        {node.title && <span>{node.title}</span>}
      </div>
      <NodeContent node={node} />
      <NodeTables node={node} />
      <NodeChildren node={node} />
    </section>
  );
}

function GenericNode({ node, depth }: { node: HierarchicalNode; depth: number }) {
  // Skip rendering for document-level nodes that have children
  if (node.type === "act" || node.type === "document") {
    return (
      <>
        <NodeContent node={node} />
        <NodeTables node={node} />
        <NodeChildren node={node} />
      </>
    );
  }

  return (
    <div className={cn("mt-4", depth > 0 && "ml-4")}>
      {(node.identifier || node.title) && (
        <div className="font-medium mb-2">
          {node.identifier && <span>{node.identifier}. </span>}
          {node.title && <span>{node.title}</span>}
        </div>
      )}
      <NodeContent node={node} />
      <NodeTables node={node} />
      <NodeChildren node={node} />
    </div>
  );
}

// ============ Content Helpers ============

type ParsedTableLike = {
  rows: string[][];
  header_rows?: number[];
};

type ContentSegment =
  | { type: "text"; text: string; fragments?: TextFragment[] }
  | { type: "table"; table: ParsedTableLike };

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => {
      const codePoint = Number.parseInt(code, 10);
      return Number.isFinite(codePoint) ? String.fromCharCode(codePoint) : "";
    });
}

function stripHtml(value: string): string {
  const withBreaks = value.replace(/<br\s*\/?>/gi, "\n");
  const noTags = withBreaks.replace(/<[^>]+>/g, " ");
  return decodeHtmlEntities(noTags)
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseHtmlTableBlock(htmlTable: string): ParsedTableLike | null {
  const rowMatches = htmlTable.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi);
  if (!rowMatches || rowMatches.length < 2) return null;

  const rows = rowMatches
    .map((rowHtml) => {
      const cellMatches = rowHtml.match(/<t[hd]\b[^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
      return cellMatches.map((cellHtml) => stripHtml(cellHtml)).filter((cell) => cell.length > 0);
    })
    .filter((cells) => cells.length > 0);

  if (rows.length < 2) return null;

  const hasHeaderRow = /<th\b/i.test(rowMatches[0]);
  return {
    rows,
    header_rows: hasHeaderRow ? [0] : undefined,
  };
}

function extractOrderedContentSegments(value: string, fragments?: TextFragment[]): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const tableRegex = /<table\b[\s\S]*?<\/table>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(value)) !== null) {
    const preceding = value.slice(lastIndex, match.index);
    const cleanedPreceding = stripHtml(preceding);
    if (cleanedPreceding.length > 0) {
      segments.push({ type: "text", text: cleanedPreceding });
    }

    const parsed = parseHtmlTableBlock(match[0]);
    if (parsed) {
      segments.push({ type: "table", table: parsed });
    }

    lastIndex = match.index + match[0].length;
  }

  const trailing = value.slice(lastIndex);
  const cleanedTrailing = stripHtml(trailing);
  if (cleanedTrailing.length > 0) {
    segments.push({ type: "text", text: cleanedTrailing, fragments });
  }

  if (segments.length === 0) {
    const cleaned = stripHtml(value);
    if (cleaned.length > 0) {
      segments.push({ type: "text", text: cleaned, fragments });
    }
  }

  return segments;
}

function extractTablesAndCleanText(value: string): { tables: ParsedTableLike[]; cleanedText: string } {
  let remaining = value;
  const tables: ParsedTableLike[] = [];

  const tableBlocks = remaining.match(/<table\b[\s\S]*?<\/table>/gi) || [];
  for (const tableBlock of tableBlocks) {
    const parsed = parseHtmlTableBlock(tableBlock);
    if (parsed) tables.push(parsed);
  }
  remaining = remaining.replace(/<table\b[\s\S]*?<\/table>/gi, " ");

  if (/<tr\b/i.test(remaining) && /<t[hd]\b/i.test(remaining)) {
    const looseRows = remaining.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
    if (looseRows.length > 0) {
      const parsedLoose = parseHtmlTableBlock(`<table>${looseRows.join("")}</table>`);
      if (parsedLoose) tables.push(parsedLoose);
      remaining = remaining.replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi, " ");
    }
  }

  const cleanedText = stripHtml(remaining)
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, "").replace(/^[ \t]+/g, ""))
    .filter((line) => line.length > 0 && !/^tbl-\d+\.html$/i.test(line))
    .join("\n");

  return { tables, cleanedText };
}

function cleanStyledFragmentText(value: string): string {
  const withoutTables = value.replace(/<table\b[\s\S]*?<\/table>/gi, " ");
  const withBreaks = withoutTables.replace(/<br\s*\/?>/gi, "\n");
  const noTags = withBreaks.replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(noTags)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function NodeContent({ node }: { node: HierarchicalNode }) {
  if (node.content && Array.isArray(node.content) && node.content.length > 0) {
    const orderedSegments: ContentSegment[] = [];

    for (const item of node.content) {
      if (item.type === "table" && item.rows && item.rows.length > 0) {
        orderedSegments.push({
          type: "table",
          table: {
            rows: item.rows,
            header_rows: item.header_rows,
          },
        });
        continue;
      }

      const rawText = item.text || item.value?.text;
      if (typeof rawText === "string" && rawText.length > 0) {
        orderedSegments.push(...extractOrderedContentSegments(rawText, item.fragments));
      }
    }

    if (orderedSegments.length > 0) {
      return (
        <div className="node-content">
          {orderedSegments.map((segment, index) => {
            if (segment.type === "table") {
              return <TableRenderer key={`table-${index}`} table={segment.table} />;
            }

            const fragments = segment.fragments
              ?.map((fragment) => {
                const cleanedText = cleanStyledFragmentText(fragment.text);
                if (!cleanedText.trim()) return null;
                return { ...fragment, text: cleanedText };
              })
              .filter((fragment): fragment is TextFragment => fragment !== null);

            if (fragments && fragments.length > 0) {
              return (
                <p key={`text-${index}`} className={cn(index === 0 ? "mt-0 mb-1" : "my-1", "whitespace-pre-wrap")}>
                  {fragments.map((fragment, fragIdx) => (
                    <StyledFragment key={fragIdx} fragment={fragment} />
                  ))}
                </p>
              );
            }

            return (
              <p key={`text-${index}`} className={cn(index === 0 ? "mt-0 mb-1" : "my-1", "whitespace-pre-wrap")}>
                <MathText text={segment.text} />
              </p>
            );
          })}
        </div>
      );
    }
  }

  // Use styled_text if available for style-aware rendering
  if (node.styled_text && node.styled_text.length > 0) {
    const cleanedBlocks = node.styled_text
      .map((block) => {
        const cleanedFragments = block.fragments
          .map((fragment) => {
            const cleanedText = cleanStyledFragmentText(fragment.text);
            if (!cleanedText.trim()) return null;
            return {
              ...fragment,
              text: cleanedText,
            };
          })
          .filter((fragment): fragment is TextFragment => fragment !== null);

        if (cleanedFragments.length === 0) return null;

        return {
          ...block,
          text: cleanedFragments.map((fragment) => fragment.text).join(""),
          fragments: cleanedFragments,
        };
      })
      .filter(
        (block): block is NonNullable<typeof node.styled_text>[number] => block !== null
      );

    if (cleanedBlocks.length === 0) return null;

    return (
      <div className="node-content">
        {cleanedBlocks.map((block, blockIdx) => (
          <p key={blockIdx} className={blockIdx === 0 ? "mt-0 mb-1" : "my-1"}>
            {block.fragments.map((fragment, fragIdx) => (
              <StyledFragment key={fragIdx} fragment={fragment} />
            ))}
          </p>
        ))}
      </div>
    );
  }

  // Fallback to plain text
  if (!node.text || node.text.length === 0) return null;

  const cleanedTextBlocks = node.text
    .map((text) => extractTablesAndCleanText(text).cleanedText)
    .filter((text) => text.length > 0);

  if (cleanedTextBlocks.length === 0) return null;

  return (
    <div className="node-content">
      {cleanedTextBlocks.map((text, index) => (
        <p key={index} className={cn(index === 0 ? "mt-0 mb-1" : "my-1", "whitespace-pre-wrap")}>
          <MathText text={text} />
        </p>
      ))}
    </div>
  );
}

/**
 * Render a styled text fragment.
 */
function StyledFragment({ fragment }: { fragment: TextFragment }) {
  // Build CSS classes
  const classes: string[] = [];

  // Apply text styles
  if (fragment.styles?.includes("bold")) classes.push("font-bold");
  if (fragment.styles?.includes("italic")) classes.push("italic");

  return (
    <span className={cn(classes)}>
      <MathText text={fragment.text} />
    </span>
  );
}

function NodeChildren({ node }: { node: HierarchicalNode }) {
  const currentAncestors = React.useContext(AncestorPathContext);

  if (!node.children || node.children.length === 0) return null;

  // Add current node to ancestor path for children
  const newAncestorPath: AncestorInfo[] = [
    ...currentAncestors,
    {
      type: node.type?.toLowerCase() || 'unknown',
      identifier: node.identifier,
      title: node.title,
    }
  ];

  return (
    <AncestorPathContext.Provider value={newAncestorPath}>
      {node.children.map((child, index) => (
        <RenderNode key={index} node={child} depth={1} />
      ))}
    </AncestorPathContext.Provider>
  );
}

function NodeTables({ node }: { node: HierarchicalNode }) {
  // Collect tables from both sources:
  // 1. node.tables[] - standard table storage
  // 2. fallback parsing from text/styled_text only when ordered content is absent
  //
  // When node.content[] exists, NodeContent() already renders that sequence in order,
  // including any embedded tables. Re-reading content here causes duplicates.
  const allTables: TableData[] = [];
  const seenTableSignatures = new Set<string>();

  const addTable = (table: TableData) => {
    const signature = JSON.stringify({
      rows: table.rows,
      header_rows: table.header_rows || [],
    });
    if (seenTableSignatures.has(signature)) return;
    seenTableSignatures.add(signature);
    allTables.push(table);
  };

  const addTables = (tables: TableData[]) => {
    for (const table of tables) addTable(table);
  };

  // Add tables from standard tables array
  if (node.tables && node.tables.length > 0) {
    addTables(node.tables);
  }

  // When ordered content is available, NodeContent has already rendered its text/table flow.
  // Avoid reparsing mirrored table HTML from content/text/styled_text here.
  if (!(node.content && Array.isArray(node.content) && node.content.length > 0)) {
    // Add tables embedded as raw HTML in node.text (common in Mistral/Gemini outputs)
    if (node.text && node.text.length > 0) {
      for (const text of node.text) {
        if (!/<(table|tr|td|th)\b/i.test(text)) continue;
        const parsedTables = extractTablesAndCleanText(text).tables;
        if (parsedTables.length > 0) {
          addTables(parsedTables);
        }
      }
    }

    // Add tables embedded in styled text fragments
    if (node.styled_text && node.styled_text.length > 0) {
      for (const block of node.styled_text) {
        for (const fragment of block.fragments) {
          const text = fragment.text;
          if (!/<(table|tr|td|th)\b/i.test(text)) continue;
          const parsedTables = extractTablesAndCleanText(text).tables;
          if (parsedTables.length > 0) {
            addTables(parsedTables);
          }
        }
      }
    }
  }

  if (allTables.length === 0) return null;

  return (
    <div className="node-tables">
      {allTables.map((table, index) => (
        <TableRenderer key={index} table={table} />
      ))}
    </div>
  );
}

// ============ Table Renderer ============

interface TableData {
  rows: string[][];
  header_rows?: number[];
  identifier?: string;
  page?: number;
}

function TableRenderer({ table }: { table: TableData }) {
  const headerRows = new Set(table.header_rows || [0]);

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse border border-border text-sm">
        <tbody>
          {table.rows.map((row, rowIndex) => {
            const isHeader = headerRows.has(rowIndex);
            const CellTag = isHeader ? "th" : "td";

            return (
              <tr
                key={rowIndex}
                className={cn(
                  "border-b border-border",
                  isHeader && "bg-muted font-semibold"
                )}
              >
                {row.map((cell, cellIndex) => (
                  <CellTag
                    key={cellIndex}
                    className={cn(
                      "p-3 border border-border align-top text-left",
                      isHeader && "font-semibold"
                    )}
                  >
                    {cell}
                  </CellTag>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default HierarchyRenderer;
