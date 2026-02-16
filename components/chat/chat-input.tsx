"use client";

import { forwardRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ToolsDropdown,
  ActiveToolIndicator,
  getToolPlaceholder,
  type ToolMode,
} from "./tools-dropdown";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onStop?: () => void;
  selectedTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput(
    {
      value,
      onChange,
      onKeyDown,
      onSubmit,
      isLoading,
      onStop,
      selectedTool,
      onSelectTool,
    },
    ref
  ) {
    return (
      <div className="border-t p-3 md:p-4">
        <div className="mx-auto max-w-3xl">
          {/* Active tool indicator */}
          {selectedTool !== "chat" && (
            <div className="mb-2">
              <ActiveToolIndicator tool={selectedTool} onClear={() => onSelectTool("chat")} />
            </div>
          )}
          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="flex items-end gap-2"
            role="search"
            aria-label="Chat input"
          >
            <label htmlFor="chat-input" className="sr-only">
              Type your legal question
            </label>
            <div className="relative flex-1">
              <div className="absolute left-3 bottom-3 z-10">
                <ToolsDropdown
                  selectedTool={selectedTool}
                  onSelectTool={onSelectTool}
                  disabled={isLoading}
                  showLabel={false}
                  className="h-10 w-10 p-0 rounded-full border-0 hover:bg-muted"
                />
              </div>
              <textarea
                id="chat-input"
                ref={ref}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder={getToolPlaceholder(selectedTool)}
                rows={1}
                aria-label="Chat message input"
                className="min-h-[48px] md:min-h-[80px] max-h-[200px] w-full resize-none rounded-3xl border border-muted-foreground/20 bg-background pl-14 pr-14 py-5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
              />
              <div className="absolute right-3 bottom-3">
                {isLoading ? (
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
                    disabled={!value.trim()}
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
