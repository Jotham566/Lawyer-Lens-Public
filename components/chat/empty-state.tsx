"use client";

import { MessageSquare, Sparkles } from "lucide-react";
import {
  ActiveToolIndicator,
  getToolEmptyStateTitle,
  getToolEmptyStateDescription,
  getToolSuggestedQuestions,
  type ToolMode,
} from "./tools-dropdown";

interface EmptyStateProps {
  selectedTool: ToolMode;
  onClearTool: () => void;
  onSelectQuestion: (question: string) => void;
}

export function EmptyState({
  selectedTool,
  onClearTool,
  onSelectQuestion,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-16 text-center">
      {/* Gradient Icon Background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
      </div>

      {/* Active Tool Indicator */}
      {selectedTool !== "chat" && (
        <div className="mb-4">
          <ActiveToolIndicator tool={selectedTool} onClear={onClearTool} />
        </div>
      )}

      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
        {getToolEmptyStateTitle(selectedTool)}
      </h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        {getToolEmptyStateDescription(selectedTool)}
      </p>

      {/* Suggested Questions */}
      <div className="mt-10 w-full max-w-lg">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          {selectedTool === "draft-contract" ? "Try these:" : "Try asking:"}
        </p>
        <div className="grid gap-3">
          {getToolSuggestedQuestions(selectedTool).map((question) => (
            <button
              key={question}
              onClick={() => onSelectQuestion(question)}
              aria-label={`Ask: ${question}`}
              className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm transition-all hover:bg-muted hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <span className="text-foreground/80 group-hover:text-foreground">
                {question}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
