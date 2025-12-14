"use client";

import { forwardRef } from "react";
import { ArrowUp } from "lucide-react";
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
      selectedTool,
      onSelectTool,
    },
    ref
  ) {
    return (
      <div className="border-t p-4">
        <div className="mx-auto max-w-3xl">
          {/* Tool Selection Row */}
          <div className="flex items-center gap-2 mb-3">
            <ToolsDropdown
              selectedTool={selectedTool}
              onSelectTool={onSelectTool}
              disabled={isLoading}
            />
            {selectedTool !== "chat" && (
              <ActiveToolIndicator
                tool={selectedTool}
                onClear={() => onSelectTool("chat")}
              />
            )}
          </div>

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
            <textarea
              id="chat-input"
              ref={ref}
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              placeholder={getToolPlaceholder(selectedTool)}
              rows={1}
              aria-label="Chat message input"
              className="min-h-[44px] max-h-[200px] flex-1 resize-none rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              className="h-[44px] w-[44px] shrink-0"
              disabled={!value.trim() || isLoading}
              aria-label="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </form>
        </div>
        <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-muted-foreground">
          Responses may contain inaccuracies. This is not legal advice. Always
          verify with a qualified lawyer.
        </p>
      </div>
    );
  }
);
