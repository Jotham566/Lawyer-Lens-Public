"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { HierarchicalNode, AmendmentMarker, FootnoteEntry, TextFragment } from "@/lib/api/types";
import { SaveToCollectionButton } from "@/components/collections/save-to-collection-button";

// ============ Amendment Helper Functions ============

/**
 * Get Tailwind CSS classes for amendment type styling.
 */
function getAmendmentClasses(amendment?: AmendmentMarker | null): string {
  if (!amendment || amendment.amendment_type === "active") return "";

  switch (amendment.amendment_type) {
    case "insertion":
      return "font-bold italic";
    case "repealed":
      return "italic text-muted-foreground line-through";
    case "substituted_old":
      return "text-muted-foreground bg-muted/50";
    case "substituted_new":
      return "font-bold";
    default:
      return "";
  }
}


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
          {/* Document Header using actual metadata */}
          {document && <DocumentHeader document={document} />}

          {/* Document Body */}
          <div className="hierarchy-body">
            {node.children?.map((child, index) => (
              <RenderNode key={index} node={child} depth={0} />
            ))}
          </div>

          {/* Footnotes Section */}
          {node.footnotes && node.footnotes.length > 0 && (
            <FootnotesSection footnotes={node.footnotes} />
          )}
        </div>
      </HighlightContext.Provider>
    </DocumentContext.Provider>
  );
}

/**
 * Footnotes Section Component
 *
 * Renders document footnotes at the bottom of the document.
 */
function FootnotesSection({ footnotes }: { footnotes: FootnoteEntry[] }) {
  if (!footnotes || footnotes.length === 0) return null;

  return (
    <div className="footnotes-section mt-12 pt-6 border-t-2 border-border">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
        Footnotes
      </h3>
      <ol className="list-none space-y-2 text-sm">
        {footnotes.map((footnote) => (
          <li key={footnote.footnote_id} className="flex items-start">
            <sup className="text-blue-600 font-bold mr-2 mt-0.5 min-w-[1.5rem] text-right">
              {footnote.marker}
            </sup>
            <div className="flex-1">
              <span className="text-foreground">{footnote.content}</span>
              {footnote.amending_act_title && (
                <span className="ml-2 text-muted-foreground text-xs">
                  [{footnote.amending_act_title}]
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function NodeSaveButton({ node, className }: { node: HierarchicalNode; className?: string }) {
  const { documentId, documentTitle, documentShortTitle } = React.useContext(DocumentContext) || {};
  const ancestorPath = React.useContext(AncestorPathContext);

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

  return (
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
      className={cn("h-6 w-6 opacity-0 group-hover/node:opacity-100 transition-opacity focus:opacity-100", className)}
      showLabel={false}
    />
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
      <div className="w-10 flex-shrink-0 flex items-start gap-1">
        {node.identifier && <span>({node.identifier})</span>}
        <NodeSaveButton node={node} className="w-4 h-4 -ml-1 mt-1 absolute -left-5" />
      </div>
      <div className="flex-1 min-w-0">
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

function NodeContent({ node }: { node: HierarchicalNode }) {
  // Use styled_text if available for amendment-aware rendering
  if (node.styled_text && node.styled_text.length > 0) {
    return (
      <div className="node-content">
        {node.styled_text.map((block, blockIdx) => (
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

  return (
    <div className="node-content">
      {node.text.map((text, index) => (
        <p key={index} className={index === 0 ? "mt-0 mb-1" : "my-1"}>
          {text}
        </p>
      ))}
    </div>
  );
}

/**
 * Render a styled text fragment with amendment formatting.
 */
function StyledFragment({ fragment }: { fragment: TextFragment }) {
  // Build CSS classes
  const classes: string[] = [];

  // Apply text styles
  if (fragment.styles?.includes("bold")) classes.push("font-bold");
  if (fragment.styles?.includes("italic")) classes.push("italic");

  // Apply amendment styling
  if (fragment.amendment) {
    classes.push(getAmendmentClasses(fragment.amendment));
  }

  // Apply superscript
  if (fragment.is_superscript) {
    return (
      <sup className={cn(classes, "text-blue-600")}>
        {fragment.text}
      </sup>
    );
  }

  // Apply color if specified
  const style = fragment.color ? { color: fragment.color } : undefined;

  return (
    <span className={cn(classes)} style={style}>
      {fragment.text}
      {/* Render footnote references as superscript */}
      {fragment.footnote_refs?.map((ref, refIdx) => (
        <sup
          key={refIdx}
          className="text-blue-600 cursor-pointer hover:underline ml-0.5"
          title={`Footnote ${ref.marker}`}
        >
          {ref.marker}
        </sup>
      ))}
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
  if (!node.tables || node.tables.length === 0) return null;

  return (
    <div className="node-tables">
      {node.tables.map((table, index) => (
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
