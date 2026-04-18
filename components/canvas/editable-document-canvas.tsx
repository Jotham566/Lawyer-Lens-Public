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
          "min-h-[640px] w-full rounded-panel bg-background px-10 py-12 sm:px-14",
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
          "[&_th]:border-b [&_th]:border-border/40 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
          "[&_td]:border-b [&_td]:border-border/20 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
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
          "[&_[data-report-part='endnotes']]:mt-8 [&_[data-report-part='endnotes']]:border-t [&_[data-report-part='endnotes']]:border-border/40 [&_[data-report-part='endnotes']]:pt-8",
          "[&_[data-report-part='endnotes']_details]:mb-3",
          "[&_[data-report-part='endnotes']_details]:rounded-3xl",
          "[&_[data-report-part='endnotes']_details]:border",
          "[&_[data-report-part='endnotes']_details]:border-border/30",
          "[&_[data-report-part='endnotes']_details]:bg-card/80",
          "[&_[data-report-part='endnotes']_details]:shadow-sm",
          "[&_[data-report-part='endnotes']_summary]:rounded-3xl",
          "[&_[data-report-part='endnotes']_summary]:px-1",
          "[&_[data-report-part='endnotes']_summary]:py-1",
          "[&_[data-contract-part='signature-block']]:mt-10 [&_[data-contract-part='signature-block']]:border-t [&_[data-contract-part='signature-block']]:border-border/40 [&_[data-contract-part='signature-block']]:pt-8",
          // Read-only chrome on kickoff briefs (header, section labels,
          // "what happens next" footer). Different visual weight from
          // the editable body so users can see at a glance what they
          // can change.
          "[&_[data-report-part='header']]:rounded-2xl [&_[data-report-part='header']]:bg-muted/40 [&_[data-report-part='header']]:px-6 [&_[data-report-part='header']]:py-5",
          "[&_[data-contract-part='header']]:rounded-2xl [&_[data-contract-part='header']]:bg-muted/40 [&_[data-contract-part='header']]:px-6 [&_[data-contract-part='header']]:py-5",
          "[&_[data-report-part='footer']]:mt-12 [&_[data-report-part='footer']]:rounded-2xl [&_[data-report-part='footer']]:border [&_[data-report-part='footer']]:border-border/40 [&_[data-report-part='footer']]:bg-muted/30 [&_[data-report-part='footer']]:px-6 [&_[data-report-part='footer']]:py-5 [&_[data-report-part='footer']_h2]:text-base [&_[data-report-part='footer']_h2]:font-semibold [&_[data-report-part='footer']_p]:text-sm [&_[data-report-part='footer']_p]:text-muted-foreground",
          "[&_[data-contract-part='footer']]:mt-12 [&_[data-contract-part='footer']]:rounded-2xl [&_[data-contract-part='footer']]:border [&_[data-contract-part='footer']]:border-border/40 [&_[data-contract-part='footer']]:bg-muted/30 [&_[data-contract-part='footer']]:px-6 [&_[data-contract-part='footer']]:py-5 [&_[data-contract-part='footer']_h2]:text-base [&_[data-contract-part='footer']_h2]:font-semibold [&_[data-contract-part='footer']_p]:text-sm [&_[data-contract-part='footer']_p]:text-muted-foreground",
          // Section-heading chrome above the editable body. Styled like
          // a form-field label + helper text so it reads as guidance,
          // not as part of the brief itself.
          "[&_[data-report-chrome='true']]:mb-3 [&_[data-report-chrome='true']_h2]:text-xs [&_[data-report-chrome='true']_h2]:font-semibold [&_[data-report-chrome='true']_h2]:uppercase [&_[data-report-chrome='true']_h2]:tracking-[0.18em] [&_[data-report-chrome='true']_h2]:text-muted-foreground [&_[data-report-chrome='true']_h2]:mb-1.5 [&_[data-report-chrome='true']_p]:text-sm [&_[data-report-chrome='true']_p]:text-muted-foreground [&_[data-report-chrome='true']_p]:mb-0",
          "[&_[data-contract-chrome='true']]:mb-3 [&_[data-contract-chrome='true']_h2]:text-xs [&_[data-contract-chrome='true']_h2]:font-semibold [&_[data-contract-chrome='true']_h2]:uppercase [&_[data-contract-chrome='true']_h2]:tracking-[0.18em] [&_[data-contract-chrome='true']_h2]:text-muted-foreground [&_[data-contract-chrome='true']_h2]:mb-1.5 [&_[data-contract-chrome='true']_p]:text-sm [&_[data-contract-chrome='true']_p]:text-muted-foreground [&_[data-contract-chrome='true']_p]:mb-0",
          // The actual editable input zone. Subtle border + background
          // tint signals "this is the field you fill in"; focus ring
          // matches the rest of the design system. CSS placeholder
          // shows when the body is empty and disappears on focus.
          "[&_[data-report-body='true']]:min-h-[180px] [&_[data-report-body='true']]:rounded-2xl [&_[data-report-body='true']]:border [&_[data-report-body='true']]:border-border/60 [&_[data-report-body='true']]:bg-card [&_[data-report-body='true']]:px-6 [&_[data-report-body='true']]:py-5 [&_[data-report-body='true']]:shadow-soft [&_[data-report-body='true']]:transition-shadow",
          "focus-within:[&_[data-report-body='true']]:border-primary/40 focus-within:[&_[data-report-body='true']]:ring-2 focus-within:[&_[data-report-body='true']]:ring-primary/20",
          "[&_[data-report-body='true']:empty]:before:content-[attr(data-placeholder)] [&_[data-report-body='true']:empty]:before:text-muted-foreground [&_[data-report-body='true']:empty]:before:italic [&_[data-report-body='true']:empty]:before:pointer-events-none",
          "[&_[data-contract-body='true']]:min-h-[180px] [&_[data-contract-body='true']]:rounded-2xl [&_[data-contract-body='true']]:border [&_[data-contract-body='true']]:border-border/60 [&_[data-contract-body='true']]:bg-card [&_[data-contract-body='true']]:px-6 [&_[data-contract-body='true']]:py-5 [&_[data-contract-body='true']]:shadow-soft [&_[data-contract-body='true']]:transition-shadow",
          "focus-within:[&_[data-contract-body='true']]:border-primary/40 focus-within:[&_[data-contract-body='true']]:ring-2 focus-within:[&_[data-contract-body='true']]:ring-primary/20",
          "[&_[data-contract-body='true']:empty]:before:content-[attr(data-placeholder)] [&_[data-contract-body='true']:empty]:before:text-muted-foreground [&_[data-contract-body='true']:empty]:before:italic [&_[data-contract-body='true']:empty]:before:pointer-events-none",
          !readOnly && "cursor-text",
          surfaceClassName
        )}
      />
    </div>
  );
}
