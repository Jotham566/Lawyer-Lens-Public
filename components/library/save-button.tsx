"use client";

import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLibraryStore } from "@/lib/stores";
import type { DocumentType } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface SaveButtonProps {
  document: {
    id: string;
    humanReadableId: string;
    title: string;
    documentType: DocumentType;
    shortTitle?: string;
    actYear?: number;
    caseNumber?: string;
    courtLevel?: string;
    publicationDate?: string;
  };
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function SaveButton({
  document,
  variant = "outline",
  size = "default",
  showLabel = true,
  className,
}: SaveButtonProps) {
  const saveDocument = useLibraryStore((s) => s.saveDocument);
  const unsaveDocument = useLibraryStore((s) => s.unsaveDocument);
  const isDocumentSaved = useLibraryStore((s) => s.isDocumentSaved);
  const isClient = useMemo(() => typeof window !== "undefined", []);
  const isSaved = isClient && isDocumentSaved(document.id);

  const handleToggle = () => {
    if (isSaved) {
      unsaveDocument(document.id);
    } else {
      saveDocument(document);
    }
  };

  if (!isClient) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className={cn("h-4 w-4 animate-spin", showLabel && "mr-2")} />
        {showLabel && "Save"}
      </Button>
    );
  }

  const button = (
    <Button
      variant={isSaved ? "default" : variant}
      size={size}
      onClick={handleToggle}
      className={cn(
        isSaved && "bg-indigo-600 hover:bg-indigo-700 text-white",
        className
      )}
    >
      {isSaved ? (
        <BookmarkCheck className={cn("h-4 w-4", showLabel && "mr-2")} />
      ) : (
        <Bookmark className={cn("h-4 w-4", showLabel && "mr-2")} />
      )}
      {showLabel && (isSaved ? "Saved" : "Save")}
    </Button>
  );

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{isSaved ? "Remove from library" : "Save to library"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
