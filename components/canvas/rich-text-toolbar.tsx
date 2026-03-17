"use client";

import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Pilcrow,
  Undo2,
  Redo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const actions = [
  { id: "bold", label: "Bold", icon: Bold, command: "bold" },
  { id: "italic", label: "Italic", icon: Italic, command: "italic" },
  { id: "underline", label: "Underline", icon: Underline, command: "underline" },
  { id: "paragraph", label: "Paragraph", icon: Pilcrow, command: "formatBlock", value: "p" },
  { id: "heading1", label: "Heading 1", icon: Heading1, command: "formatBlock", value: "h1" },
  { id: "heading2", label: "Heading 2", icon: Heading2, command: "formatBlock", value: "h2" },
  { id: "bullet", label: "Bullet List", icon: List, command: "insertUnorderedList" },
  { id: "numbered", label: "Numbered List", icon: ListOrdered, command: "insertOrderedList" },
  { id: "quote", label: "Quote", icon: Quote, command: "formatBlock", value: "blockquote" },
  { id: "undo", label: "Undo", icon: Undo2, command: "undo" },
  { id: "redo", label: "Redo", icon: Redo2, command: "redo" },
] as const;

interface RichTextToolbarProps {
  editor: HTMLElement | null;
  disabled?: boolean;
}

export function RichTextToolbar({ editor, disabled = false }: RichTextToolbarProps) {
  const handleCommand = (command: string, value?: string) => {
    if (disabled || !editor || typeof document === "undefined") return;
    editor.focus();
    document.execCommand(command, false, value);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: null }));
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full border bg-background/95 p-2 shadow-sm backdrop-blur">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || !editor}
            onMouseDown={(event) => {
              event.preventDefault();
              handleCommand(action.command, "value" in action ? action.value : undefined);
            }}
            title={action.label}
            className="h-8 w-8 rounded-full"
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
