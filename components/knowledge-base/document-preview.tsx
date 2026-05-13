"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  FileText,
  Hash,
  AlertCircle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDocumentPreview,
  type DocumentPreviewResponse,
  type OrgDocument,
} from "@/lib/api/knowledge-base";

/**
 * Preview drawer for an indexed KB document.
 *
 * Shows the exact chunk text the system embedded, grouped by chunk
 * with section/page headers when present. Surfaces "Showing first N
 * of M chunks" + a "Truncated at X characters" notice if the doc was
 * too large to return in one shot. Renders inside a right-side Sheet
 * so the underlying document list stays visible behind it.
 *
 * Why chunks rather than the raw file: the operator's question on the
 * Documents tab is usually "what does Ben see when it cites this
 * doc?" — and the chunks ARE that view. A raw-file viewer would need
 * S3 presigning, MIME-aware rendering, and would not match what the
 * retriever actually sees post-OCR + post-cleanup.
 */
export function DocumentPreviewSheet({
  document,
  open,
  onOpenChange,
}: {
  document: OrgDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [preview, setPreview] = useState<DocumentPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !document) {
      setPreview(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPreview(null);

    getDocumentPreview(document.id)
      .then((res) => {
        if (!cancelled) setPreview(res);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "We couldn't load this document's preview.";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, document]);

  if (!document) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b px-6 py-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="truncate text-left">
                  {document.title}
                </SheetTitle>
                <SheetDescription className="text-left text-xs">
                  {document.filename}
                </SheetDescription>
              </div>
            </div>
          </div>

          {preview && (
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {preview.returned_chunks} of {preview.total_chunks} chunks
              </span>
              <span>
                {preview.total_chars.toLocaleString()} chars
                {preview.truncated && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    (truncated)
                  </span>
                )}
              </span>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && <PreviewSkeleton />}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm font-medium">Preview unavailable</p>
              <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          {preview && !loading && preview.sections.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Eye className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No extracted text yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                This document hasn&apos;t been processed into chunks yet, or
                the indexer didn&apos;t find any readable text. If it&apos;s
                still processing, check back in a minute.
              </p>
            </div>
          )}

          {preview && preview.sections.length > 0 && (
            <div className="space-y-5">
              {preview.sections.map((section) => (
                <article
                  key={section.chunk_index}
                  className="space-y-2 rounded-lg border border-border/60 bg-surface-container-low p-4"
                >
                  <header className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Chunk {section.chunk_index + 1}
                    </span>
                    {section.page_number && (
                      <span>Page {section.page_number}</span>
                    )}
                  </header>
                  {section.section_heading && (
                    <h4 className="text-sm font-semibold text-foreground">
                      {section.section_heading}
                    </h4>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {section.text}
                  </p>
                </article>
              ))}

              {preview.truncated && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                  Preview truncated at{" "}
                  {preview.total_chars.toLocaleString()} characters. The
                  full document remains searchable end-to-end through
                  Ask Ben.
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PreviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}

export default DocumentPreviewSheet;
