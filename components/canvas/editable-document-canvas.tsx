"use client";

import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";
import { sanitizeRichHtml, stripEditorArtifacts } from "@/lib/utils/rich-text";

interface EditableDocumentCanvasProps {
  html: string;
  onChange: (html: string) => void;
  onSectionFocus?: (sectionId: string | null) => void;
  onEditorReady?: ((editor: HTMLElement | null) => void) | undefined;
  readOnly?: boolean;
  className?: string;
  surfaceClassName?: string;
}

const INPUT_SYNC_DEBOUNCE_MS = 180;

export function EditableDocumentCanvas({
  html,
  onChange,
  onSectionFocus,
  onEditorReady,
  readOnly = false,
  className,
  surfaceClassName,
}: EditableDocumentCanvasProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const pendingHtmlRef = useRef<string | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommittedHtmlRef = useRef<string>("");
  const sanitizedHtml = useMemo(() => sanitizeRichHtml(html), [html]);

  const flushPendingChange = () => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    if (pendingHtmlRef.current == null) return;
    const value = stripEditorArtifacts(pendingHtmlRef.current);
    pendingHtmlRef.current = null;
    const sanitizedValue = sanitizeRichHtml(value);
    lastCommittedHtmlRef.current = sanitizedValue;
    onChange(sanitizedValue);
  };

  const scheduleFlushPendingChange = () => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(flushPendingChange, INPUT_SYNC_DEBOUNCE_MS);
  };

  useEffect(() => {
    const editor = editorRef.current;
    onEditorReady?.(editor);
    return () => onEditorReady?.(null);
  }, [onEditorReady]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const activeElement = typeof document !== "undefined" ? document.activeElement : null;
    const isEditingThisCanvas = activeElement === editor || editor.contains(activeElement);
    const liveEditorHtml = sanitizeRichHtml(stripEditorArtifacts(editor.innerHTML));

    if (isEditingThisCanvas && pendingHtmlRef.current !== null) {
      return;
    }

    if (isEditingThisCanvas && liveEditorHtml === sanitizedHtml) {
      lastCommittedHtmlRef.current = sanitizedHtml;
      return;
    }

    if (editor.innerHTML !== sanitizedHtml) {
      editor.innerHTML = sanitizedHtml;
    }
    lastCommittedHtmlRef.current = sanitizedHtml;
  }, [sanitizedHtml]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const handleSectionFocus = (target: EventTarget | null) => {
    if (!onSectionFocus || !(target instanceof HTMLElement)) return;
    const section = target.closest<HTMLElement>("[data-section-anchor]");
    onSectionFocus(section?.dataset.sectionAnchor ?? null);
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onFocus={(event) => handleSectionFocus(event.target)}
        onClick={(event) => {
          const target = event.target;
          setTimeout(() => handleSectionFocus(target), 0);
        }}
        onBlur={() => {
          setTimeout(() => flushPendingChange(), 0);
        }}
        onInput={(event) => {
          pendingHtmlRef.current = (event.currentTarget as HTMLDivElement).innerHTML;
          scheduleFlushPendingChange();
        }}
        className={cn(
          "min-h-[640px] w-full rounded-[28px] bg-background px-10 py-12 sm:px-14",
          "font-serif text-[17px] leading-[1.85] text-foreground antialiased outline-none",
          "[&_header]:mb-10 [&_header]:space-y-5",
          "[&_section]:scroll-mt-28 [&_section]:py-7",
          "[&_h1]:mb-4 [&_h1]:text-[2.6rem] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:leading-tight",
          "[&_h2]:mb-4 [&_h2]:text-[1.85rem] [&_h2]:font-semibold [&_h2]:tracking-tight",
          "[&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[1.35rem] [&_h3]:font-semibold",
          "[&_p]:mb-4 [&_p]:text-foreground/90",
          "[&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/20 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-foreground/80",
          "[&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6",
          "[&_li]:mb-2",
          "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[15px]",
          "[&_th]:border-b [&_th]:border-border/70 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
          "[&_td]:border-b [&_td]:border-border/40 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
          "[&_sup]:ml-1 [&_sup]:align-super",
          "[&_sup_a]:rounded-full [&_sup_a]:bg-muted [&_sup_a]:px-1.5 [&_sup_a]:py-0.5 [&_sup_a]:text-[11px] [&_sup_a]:font-sans [&_sup_a]:no-underline",
          "[&_summary]:outline-none",
          "[&_summary::-webkit-details-marker]:hidden",
          "[&_[data-inline-citations='true']]:relative",
          "[&_[data-inline-citations='true']]:mx-0.5",
          "[&_[data-inline-citations='true']_a]:no-underline",
          "[&_[data-inline-citations='true']>span:last-child]:pointer-events-none",
          "[&_[data-inline-citations='true']>span:last-child]:translate-y-1",
          "[&_[data-inline-citations='true']:hover>span:last-child]:translate-y-0",
          "[&_[data-report-part='endnotes']]:mt-8 [&_[data-report-part='endnotes']]:border-t [&_[data-report-part='endnotes']]:border-border/60 [&_[data-report-part='endnotes']]:pt-8",
          "[&_[data-report-part='endnotes']_details]:mb-3",
          "[&_[data-report-part='endnotes']_details]:rounded-[20px]",
          "[&_[data-report-part='endnotes']_details]:border",
          "[&_[data-report-part='endnotes']_details]:border-black/5",
          "[&_[data-report-part='endnotes']_details]:bg-[#f5f6f9]",
          "[&_[data-report-part='endnotes']_details]:shadow-sm",
          "dark:[&_[data-report-part='endnotes']_details]:border-white/10",
          "dark:[&_[data-report-part='endnotes']_details]:bg-[#141922]",
          "[&_[data-report-part='endnotes']_summary]:rounded-[20px]",
          "[&_[data-report-part='endnotes']_summary]:px-1",
          "[&_[data-report-part='endnotes']_summary]:py-1",
          "[&_[data-contract-part='signature-block']]:mt-10 [&_[data-contract-part='signature-block']]:border-t [&_[data-contract-part='signature-block']]:border-border/60 [&_[data-contract-part='signature-block']]:pt-8",
          !readOnly && "cursor-text",
          surfaceClassName
        )}
      />
    </div>
  );
}
