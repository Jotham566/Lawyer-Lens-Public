"use client";

import type { ReactNode } from "react";
import { Sparkles, MessageSquare, Search, FileText } from "lucide-react";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import {
  getToolEmptyStateDescription,
  getToolSuggestedQuestions,
  type ToolMode,
} from "./tools-dropdown";

interface EmptyStateProps {
  selectedTool: ToolMode;
  onSelectQuestion: (question: string) => void;
  composer: ReactNode;
}

export function EmptyState({
  selectedTool,
  onSelectQuestion,
  composer,
}: EmptyStateProps) {
  const modeMeta = {
    chat: {
      icon: Sparkles,
      eyebrow: "Legal Assistant",
      title: "Where should we start?",
    },
    "deep-research": {
      icon: Search,
      eyebrow: "Deep Research",
      title: "What should we investigate?",
    },
    "draft-contract": {
      icon: FileText,
      eyebrow: "Draft Contract",
      title: "What should we draft?",
    },
  } as const;

  const currentMode = modeMeta[selectedTool];
  const ModeIcon = currentMode.icon;

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-8 text-center md:px-6 md:py-12">
      <div className="w-full max-w-4xl">
        <div className="mx-auto mb-8 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 text-muted-foreground">
            <ModeIcon className="h-4 w-4 text-primary" />
            <span className="text-lg font-medium">{currentMode.eyebrow}</span>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {currentMode.title}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            {getToolEmptyStateDescription(selectedTool)}
          </p>
        </div>

        <div className="mx-auto w-full max-w-3xl">
          {composer}
        </div>

        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-3">
          {getToolSuggestedQuestions(selectedTool).map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onSelectQuestion(question)}
              aria-label={`Ask: ${question}`}
              className={cn(
                "px-4 py-3 text-sm",
                surfaceClasses.chipButton
              )}
            >
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="max-w-[260px] truncate sm:max-w-none">{question}</span>
            </button>
          ))}
        </div>

        <p className="mx-auto mt-5 max-w-md text-center text-xs text-muted-foreground/60">
          Responses may contain inaccuracies. This is not legal advice. Always verify with a qualified lawyer.
        </p>
      </div>
    </div>
  );
}
