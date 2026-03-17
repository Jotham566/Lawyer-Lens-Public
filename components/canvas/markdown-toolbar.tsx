"use client";

import type { ComponentType } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Minus,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export type MarkdownToolbarAction =
  | "heading1"
  | "heading2"
  | "bold"
  | "italic"
  | "bullet"
  | "numbered"
  | "quote"
  | "divider";

interface MarkdownToolbarProps {
  disabled?: boolean;
  onAction: (action: MarkdownToolbarAction) => void;
}

const actions: Array<{
  id: MarkdownToolbarAction;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "heading1", label: "Heading 1", icon: Heading1 },
  { id: "heading2", label: "Heading 2", icon: Heading2 },
  { id: "bold", label: "Bold", icon: Bold },
  { id: "italic", label: "Italic", icon: Italic },
  { id: "bullet", label: "Bullet list", icon: List },
  { id: "numbered", label: "Numbered list", icon: ListOrdered },
  { id: "quote", label: "Quote", icon: Quote },
  { id: "divider", label: "Divider", icon: Minus },
];

export function MarkdownToolbar({ disabled = false, onAction }: MarkdownToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => onAction(action.id)}
            title={action.label}
            className="h-8 w-8"
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
