"use client";

import { forwardRef, useEffect, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ToolsDropdown,
  getToolPlaceholder,
  type ToolMode,
} from "./tools-dropdown";

interface ChatInputProps {
  value: string;
  onSubmit: (value: string, tool: ToolMode) => void;
  isLoading: boolean;
  isGenerating?: boolean;
  onStop?: () => void;
  selectedTool?: ToolMode;
  onSelectTool?: (tool: ToolMode) => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput(
    {
      value,
      onSubmit,
      isLoading,
      isGenerating,
      onStop,
      selectedTool: controlledTool,
      onSelectTool,
    },
    ref
  ) {
    const [draft, setDraft] = useState(value);
    const [internalTool, setInternalTool] = useState<ToolMode>("chat");
    const selectedTool = controlledTool ?? internalTool;
    const handleSelectTool = onSelectTool ?? setInternalTool;

    useEffect(() => {
      setDraft(value);
    }, [value]);

    // Show stop button only while LLM is actively generating text
    const showStop = isGenerating ?? isLoading;
    return (
      <div className="p-3 md:p-4">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = draft.trim();
              if (!trimmed) return;
              setTimeout(() => onSubmit(trimmed, selectedTool), 0);
              setDraft("");
              if (!onSelectTool) {
                setInternalTool("chat");
              }
            }}
            className="rounded-[28px] border border-muted-foreground/20 bg-background px-3 py-3 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring"
            role="search"
            aria-label="Chat input"
          >
            <label htmlFor="chat-input" className="sr-only">
              Type your legal question
            </label>
            <div className="relative">
              <div className="absolute bottom-0 left-0 z-10">
                <ToolsDropdown
                  selectedTool={selectedTool}
                  onSelectTool={handleSelectTool}
                  disabled={isLoading}
                  showLabel
                  className="h-9 rounded-full border-0 bg-transparent px-2 text-sm shadow-none hover:bg-muted"
                />
              </div>
              <textarea
                id="chat-input"
                ref={ref}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const trimmed = draft.trim();
                    if (!trimmed) return;
                    setTimeout(() => onSubmit(trimmed, selectedTool), 0);
                    setDraft("");
                    if (!onSelectTool) {
                      setInternalTool("chat");
                    }
                  }
                }}
                placeholder={getToolPlaceholder(selectedTool)}
                rows={1}
                aria-label="Chat message input"
                className="min-h-[64px] max-h-[220px] w-full resize-none border-0 bg-transparent px-0 pb-12 pt-2 text-sm outline-none placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0"
              />
              <div className="absolute bottom-0 right-0">
                {showStop ? (
                  <Button
                    type="button"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-destructive hover:bg-destructive/90"
                    onClick={onStop}
                    aria-label="Stop generation"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    disabled={!draft.trim()}
                    aria-label="Send message"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </form>
          {/* Keyboard hint — desktop only */}
          <p className="hidden md:block mt-1 text-center text-[11px] text-muted-foreground/50">
            ↵ Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    );
  }
);
