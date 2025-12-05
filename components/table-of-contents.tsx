"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HierarchicalNode } from "@/lib/api/types";

interface TocItem {
  id: string;
  type: string;
  identifier?: string;
  title?: string;
  depth: number;
  children: TocItem[];
}

interface TableOfContentsProps {
  node: HierarchicalNode;
  className?: string;
}

// Node types that should appear in ToC
const TOC_TYPES = new Set([
  "part",
  "chapter",
  "section",
  "schedule",
  "article",
  "division",
]);

/**
 * Extract ToC items from hierarchical structure
 */
function extractTocItems(
  node: HierarchicalNode,
  depth: number = 0
): TocItem[] {
  const items: TocItem[] = [];
  const nodeType = node.type?.toLowerCase() || "";

  // Check if this node should be in ToC
  if (TOC_TYPES.has(nodeType) && (node.identifier || node.title)) {
    const id = node.akn_eid || `${nodeType}-${node.identifier || "unknown"}`;
    const childItems: TocItem[] = [];

    // Extract children's ToC items
    if (node.children) {
      for (const child of node.children) {
        childItems.push(...extractTocItems(child, depth + 1));
      }
    }

    items.push({
      id,
      type: nodeType,
      identifier: node.identifier,
      title: node.title,
      depth,
      children: childItems,
    });
  } else if (node.children) {
    // Not a ToC node, but check children
    for (const child of node.children) {
      items.push(...extractTocItems(child, depth));
    }
  }

  return items;
}

/**
 * Format ToC item label based on type
 */
function formatTocLabel(item: TocItem): string {
  const type = item.type;
  const id = item.identifier;
  const title = item.title;

  switch (type) {
    case "part":
      return id && title
        ? `Part ${id} – ${title}`
        : id
          ? `Part ${id}`
          : title || "Part";
    case "chapter":
      return id && title
        ? `Chapter ${id} – ${title}`
        : id
          ? `Chapter ${id}`
          : title || "Chapter";
    case "section":
      return id && title
        ? `${id}. ${title}`
        : id
          ? `Section ${id}`
          : title || "Section";
    case "schedule":
      return id && title
        ? `Schedule ${id} – ${title}`
        : id
          ? `Schedule ${id}`
          : title || "Schedule";
    case "article":
      return id && title
        ? `Article ${id}. ${title}`
        : id
          ? `Article ${id}`
          : title || "Article";
    default:
      return id && title ? `${id}. ${title}` : id || title || type;
  }
}

/**
 * Single ToC item with optional children
 */
function TocItemComponent({
  item,
  activeId,
  onSelect,
}: {
  item: TocItem;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children.length > 0;
  const isActive = activeId === item.id;

  // Check if any child is active (recursive helper)
  const checkHasActiveChild = (items: TocItem[], targetId: string | null): boolean => {
    if (!targetId) return false;
    for (const child of items) {
      if (child.id === targetId) return true;
      if (checkHasActiveChild(child.children, targetId)) return true;
    }
    return false;
  };

  const isParentOfActive = checkHasActiveChild(item.children, activeId);

  // Indent based on type hierarchy
  const getIndentClass = () => {
    switch (item.type) {
      case "part":
        return "pl-0";
      case "chapter":
        return "pl-3";
      case "section":
        return "pl-4";
      case "schedule":
        return "pl-0";
      default:
        return "pl-4";
    }
  };

  return (
    <div className={cn("toc-item", getIndentClass())}>
      <div
        className={cn(
          "flex items-start gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent/50",
          isActive && "bg-primary/10 text-primary font-medium",
          isParentOfActive && !isActive && "text-primary/80"
        )}
        onClick={() => onSelect(item.id)}
        title={formatTocLabel(item)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-accent rounded shrink-0 mt-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-4 shrink-0" />}
        <span className="text-sm leading-snug break-words">{formatTocLabel(item)}</span>
      </div>

      {hasChildren && isExpanded && (
        <div className="toc-children">
          {item.children.map((child) => (
            <TocItemComponent
              key={child.id}
              item={child}
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Table of Contents component
 * Extracts structure from hierarchical node and provides navigation
 */
export function TableOfContents({ node, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract ToC items from hierarchical structure
  const tocItems = extractTocItems(node);

  // Handle scroll to section
  const handleSelect = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  // Track scroll position to highlight current section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-toc-id]");
      let currentId: string | null = null;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        // Consider section "active" if it's in the top third of viewport
        if (rect.top <= window.innerHeight / 3 && rect.bottom > 0) {
          currentId = section.getAttribute("data-toc-id");
        }
      });

      if (currentId) {
        setActiveId(currentId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "toc-container border rounded-lg bg-card h-[calc(100vh-140px)]",
        isCollapsed ? "w-12" : "w-72",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        {!isCollapsed && (
          <h3 className="font-medium text-sm">Table of Contents</h3>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* ToC Items */}
      {!isCollapsed && (
        <ScrollArea className="h-[calc(100%-52px)]">
          <div className="p-3">
            {tocItems.map((item) => (
              <TocItemComponent
                key={item.id}
                item={item}
                activeId={activeId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default TableOfContents;
