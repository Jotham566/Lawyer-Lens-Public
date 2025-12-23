"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { HierarchicalNode } from "@/lib/api/types";

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
}

// Context for passing highlight state down the component tree
const HighlightContext = React.createContext<string | null>(null);

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
}: HierarchyRendererProps) {
  return (
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
      </div>
    </HighlightContext.Provider>
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
        "mt-10 first:mt-0 scroll-mt-4",
        isHighlighted && "section-highlighted"
      )}
    >
      <h2 className="text-center font-bold text-lg mb-6">
        {node.identifier && <span>PART {node.identifier}</span>}
        {node.identifier && node.title && <span> – </span>}
        {node.title && <span>{node.title}</span>}
      </h2>
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
        "mt-8 scroll-mt-4",
        isHighlighted && "section-highlighted"
      )}
    >
      <h3 className="text-center font-bold mb-4">
        {node.identifier && <span>Chapter {node.identifier}</span>}
        {node.identifier && node.title && <span> – </span>}
        {node.title && <span>{node.title}</span>}
      </h3>
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
        "mt-6 scroll-mt-4",
        isHighlighted && "section-highlighted"
      )}
    >
      <div className="font-bold mb-2">
        {node.identifier && <span>{node.identifier}. </span>}
        {node.title && <span>{node.title}</span>}
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
        "flex mt-2 scroll-mt-24", // Increased scroll margin for sticky header safety
        isHighlighted && "section-highlighted"
      )}
    >
      <div className="w-10 flex-shrink-0">
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

function NodeChildren({ node }: { node: HierarchicalNode }) {
  if (!node.children || node.children.length === 0) return null;

  return (
    <>
      {node.children.map((child, index) => (
        <RenderNode key={index} node={child} depth={1} />
      ))}
    </>
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
