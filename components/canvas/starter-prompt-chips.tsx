"use client";

import { Sparkles } from "lucide-react";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface StarterPromptChipsProps {
  /** Heading shown above the chips. */
  label?: string;
  /** Prompt strings to render as one-click chips. */
  prompts: string[];
  /** Called with the chosen prompt when a chip is clicked. */
  onSelect: (prompt: string) => void;
  /** Optional aria-label prefix for each chip ("Start research with: ..."). */
  ariaActionLabel?: string;
  className?: string;
}

/**
 * One-click starter prompts for kickoff workspaces. The chat empty state
 * has long shown chips like these (components/chat/empty-state.tsx); the
 * dedicated /research and /contracts kickoff pages did not, leaving
 * users staring at a blank document with no idea what a good brief
 * looks like. Same chip pattern, same data source, same affordance.
 */
export function StarterPromptChips({
  label = "Start with an example",
  prompts,
  onSelect,
  ariaActionLabel = "Use prompt",
  className,
}: StarterPromptChipsProps) {
  if (prompts.length === 0) return null;

  return (
    <div className={cn("mb-6", className)}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            aria-label={`${ariaActionLabel}: ${prompt}`}
            className={cn("px-3 py-2 text-xs", surfaceClasses.chipButton)}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span className="max-w-[280px] truncate sm:max-w-[360px]">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
