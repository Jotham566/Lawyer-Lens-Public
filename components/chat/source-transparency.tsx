"use client";

import * as React from "react";
import {
  Database,
  FileText,
  Scale,
  Gavel,
  ScrollText,
  ChevronDown,
  Info,
  Search,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatSource, DocumentType } from "@/lib/api/types";

interface SourceTransparencyProps {
  sources: ChatSource[];
  searchedDatabases?: string[];
  searchTime?: number;
  totalDocumentsSearched?: number;
  className?: string;
}

interface SourcesByType {
  type: DocumentType;
  count: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/**
 * Get icon and metadata for document type
 */
function getDocTypeInfo(type: DocumentType): {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
} {
  switch (type) {
    case "constitution":
      return {
        icon: Scale,
        label: "Constitution",
        color: "text-amber-600 dark:text-amber-400",
      };
    case "act":
      return {
        icon: FileText,
        label: "Acts",
        color: "text-blue-600 dark:text-blue-400",
      };
    case "regulation":
      return {
        icon: ScrollText,
        label: "Regulations",
        color: "text-green-600 dark:text-green-400",
      };
    case "judgment":
      return {
        icon: Gavel,
        label: "Judgments",
        color: "text-purple-600 dark:text-purple-400",
      };
    default:
      return {
        icon: FileText,
        label: "Documents",
        color: "text-slate-600 dark:text-slate-400",
      };
  }
}

/**
 * Group sources by document type
 */
function groupSourcesByType(sources: ChatSource[]): SourcesByType[] {
  const counts: Record<DocumentType, number> = {
    constitution: 0,
    act: 0,
    regulation: 0,
    judgment: 0,
  };

  sources.forEach((source) => {
    if (source.document_type in counts) {
      counts[source.document_type]++;
    }
  });

  // Return in authority order (Constitution > Acts > Regulations > Judgments)
  const order: DocumentType[] = ["constitution", "act", "regulation", "judgment"];

  return order
    .filter((type) => counts[type] > 0)
    .map((type) => {
      const info = getDocTypeInfo(type);
      return {
        type,
        count: counts[type],
        label: info.label,
        icon: info.icon,
        color: info.color,
      };
    });
}

/**
 * Calculate average relevance score
 */
function getAverageRelevance(sources: ChatSource[]): number {
  if (sources.length === 0) return 0;
  const total = sources.reduce((sum, s) => sum + (s.relevance_score || 0), 0);
  return total / sources.length;
}

/**
 * SourceTransparency - Shows information about sources used in response
 *
 * Provides transparency about what databases were searched, how many
 * sources were found, and the breakdown by document type.
 */
export function SourceTransparency({
  sources,
  searchedDatabases = ["Uganda Legal Database"],
  searchTime,
  totalDocumentsSearched,
  className,
}: SourceTransparencyProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const sourcesByType = groupSourcesByType(sources);
  const avgRelevance = getAverageRelevance(sources);
  const uniqueDocuments = new Set(sources.map((s) => s.document_id)).size;

  if (sources.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800",
          className
        )}
        role="status"
      >
        <Info className="h-4 w-4 text-slate-500" />
        <span className="text-xs text-slate-600 dark:text-slate-400">
          No specific sources cited for this response
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <Info className="h-3.5 w-3.5" />
              <span className="sr-only">More information</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">
              This response is based on general legal knowledge. For specific
              legal questions, try asking about particular statutes or cases.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "rounded-lg border bg-muted/30 overflow-hidden",
          className
        )}
      >
        {/* Summary header - always visible */}
        <CollapsibleTrigger asChild>
          <button
            className="flex items-center justify-between w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left"
            aria-expanded={isOpen}
            aria-controls="source-details"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">
                {uniqueDocuments} source{uniqueDocuments !== 1 ? "s" : ""} from{" "}
                {sourcesByType.length} document type
                {sourcesByType.length !== 1 ? "s" : ""}
              </span>
              {avgRelevance >= 0.7 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                >
                  High relevance
                </Badge>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        {/* Expanded details */}
        <CollapsibleContent id="source-details">
          <div className="px-3 pb-3 space-y-3 border-t border-border/50">
            {/* Source type breakdown */}
            <div className="pt-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Sources by Type
              </p>
              <div className="flex flex-wrap gap-2">
                {sourcesByType.map(({ type, count, label, icon: Icon, color }) => (
                  <div
                    key={type}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border text-xs"
                  >
                    <Icon className={cn("h-3.5 w-3.5", color)} />
                    <span className="font-medium">{count}</span>
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Databases searched */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Databases Searched
              </p>
              <div className="flex flex-wrap gap-1.5">
                {searchedDatabases.map((db) => (
                  <span
                    key={db}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background border text-xs"
                  >
                    <Search className="h-3 w-3 text-muted-foreground" />
                    {db}
                  </span>
                ))}
              </div>
            </div>

            {/* Search stats */}
            {(searchTime || totalDocumentsSearched) && (
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                {totalDocumentsSearched && (
                  <span>
                    Searched {totalDocumentsSearched.toLocaleString()} documents
                  </span>
                )}
                {searchTime && <span>in {searchTime}ms</span>}
              </div>
            )}

            {/* Authority note */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium">Authority hierarchy:</span> The
                Constitution takes precedence, followed by Acts of Parliament,
                Regulations, and case law.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/**
 * SourceTransparencyInline - Minimal inline version
 */
export function SourceTransparencyInline({
  sources,
  className,
}: {
  sources: ChatSource[];
  className?: string;
}) {
  const sourcesByType = groupSourcesByType(sources);
  const uniqueDocuments = new Set(sources.map((s) => s.document_id)).size;

  if (sources.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-help",
            className
          )}
        >
          <Database className="h-3 w-3" />
          <span>
            {uniqueDocuments} source{uniqueDocuments !== 1 ? "s" : ""}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-2">
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Sources used:</p>
          <div className="flex flex-wrap gap-1.5">
            {sourcesByType.map(({ type, count, label, icon: Icon, color }) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 text-[11px]"
              >
                <Icon className={cn("h-3 w-3", color)} />
                <span>
                  {count} {label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
