"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatSource } from "@/lib/api/types";

interface SourceBadgeProps {
  source: ChatSource;
}

// Get badge color based on document type
function getBadgeClass(documentType: string): string {
  switch (documentType) {
    case "act":
      return "border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950";
    case "judgment":
      return "border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950";
    case "regulation":
      return "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950";
    case "constitution":
      return "border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950";
    default:
      return "";
  }
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <Link href={`/document/${source.document_id}`}>
      <Badge
        variant="outline"
        className={cn("gap-1.5 transition-colors", getBadgeClass(source.document_type))}
      >
        <FileText className="h-3 w-3" />
        <span className="max-w-[180px] truncate">{source.title}</span>
      </Badge>
    </Link>
  );
}

interface SourceBadgeListProps {
  sources: ChatSource[];
}

export function SourceBadgeList({ sources }: SourceBadgeListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source, index) => (
        <SourceBadge key={index} source={source} />
      ))}
    </div>
  );
}
