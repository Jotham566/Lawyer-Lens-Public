"use client";

import { useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  ensureRichHtml,
  sanitizeRichHtml,
  stripEditorArtifacts,
} from "@/lib/utils/rich-text";

interface EditableMarkdownSectionProps {
  id: string;
  content: string;
  richContent?: string | null;
  onChange: (content: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  annotationHtml?: string;
}

/**
 * EditableMarkdownSection
 *
 * Rich in-place editor block used inside the document canvas.
 * The editing surface is always WYSIWYG and never exposes raw markdown.
 */
export function EditableMarkdownSection({
  id,
  content,
  richContent,
  onChange,
  onFocus,
  placeholder = "Click to edit...",
  className,
  readOnly = false,
  annotationHtml,
}: EditableMarkdownSectionProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const baseHtml = useMemo(
    () => ensureRichHtml(content, richContent),
    [content, richContent]
  );

  const composedHtml = useMemo(() => {
    const annotation = annotationHtml
      ? `<span data-inline-citations="true" contenteditable="false">${annotationHtml}</span>`
      : "";
    const html = `${baseHtml}${annotation}`;
    return sanitizeRichHtml(html);
  }, [annotationHtml, baseHtml]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== composedHtml) {
      editor.innerHTML = composedHtml;
    }
  }, [composedHtml]);

  return (
    <div className={cn("relative", className)} data-section-id={id}>
      <div
        ref={editorRef}
        data-section-id={id}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onFocus={onFocus}
        onInput={(event) => {
          const html = stripEditorArtifacts((event.currentTarget as HTMLDivElement).innerHTML);
          onChange(sanitizeRichHtml(html));
        }}
        className={cn(
          "min-h-[48px] w-full bg-transparent px-0",
          "font-serif text-[17px] leading-[1.85] text-foreground",
          "outline-none",
          "[&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-bold",
          "[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold",
          "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold",
          "[&_p]:mb-4 [&_p:empty]:before:content-[attr(data-placeholder)] [&_p:empty]:before:text-muted-foreground/40",
          "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic",
          "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
          "[&_sup_a]:rounded-full [&_sup_a]:px-1.5 [&_sup_a]:py-0.5 [&_sup_a]:text-[11px] [&_sup_a]:no-underline",
          !readOnly && "cursor-text"
        )}
        aria-label={placeholder}
      />
    </div>
  );
}
