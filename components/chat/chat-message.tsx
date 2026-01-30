"use client";

import React, { memo, forwardRef, useState, useEffect } from "react";
import {
  Bot,
  Copy,
  Check,
  RefreshCw,
  Pencil,
  X,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";
import { TrustBadge, ConfidenceFactors, UncertaintyDisclaimer } from "./trust-indicator";
import { SourceBadgeList } from "./source-badge";
import { MessageFeedback } from "./message-feedback";
import { SourceTransparencyInline } from "./source-transparency";
import type { ChatMessage as ChatMessageType } from "@/lib/api/types";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
    </div>
  );
}

interface MessageEditFormProps {
  initialContent: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export const MessageEditForm = forwardRef<
  HTMLTextAreaElement,
  MessageEditFormProps
>(function MessageEditForm(
  { initialContent, onSubmit, onCancel },
  ref
) {
  // Use local state to prevent cursor jumping on parent re-renders
  const [localContent, setLocalContent] = useState(initialContent);

  // Sync with initial content if it changes (e.g., editing different message)
  useEffect(() => {
    setLocalContent(initialContent);
  }, [initialContent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (localContent.trim()) {
        onSubmit(localContent);
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="w-full space-y-3">
      <textarea
        ref={ref}
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Edit message"
        className="w-full min-h-[100px] resize-y rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        rows={Math.max(Math.min(localContent.split("\n").length + 2, 10), 3)}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3 w-3" />
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSubmit(localContent)} disabled={!localContent.trim()}>
          <Send className="mr-1 h-3 w-3" />
          Send
        </Button>
      </div>
    </div>
  );
});

interface UserMessageActionsProps {
  onEdit: () => void;
  onCopy: () => void;
  copied: boolean;
  disabled: boolean;
}

function UserMessageActions({ onEdit, onCopy, copied, disabled }: UserMessageActionsProps) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onEdit}
            disabled={disabled}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit message</TooltipContent>
      </Tooltip>
    </>
  );
}

interface AssistantMessageActionsProps {
  messageId: string;
  content: string;
  copiedId: string | null;
  onCopy: (id: string, content: string) => void;
  onRegenerate: () => void;
  disabled: boolean;
}

function AssistantMessageActions({
  messageId,
  content,
  copiedId,
  onCopy,
  onRegenerate,
  disabled,
}: AssistantMessageActionsProps) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onCopy(messageId, content)}
          >
            {copiedId === messageId ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {copiedId === messageId ? "Copied!" : "Copy"}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRegenerate}
            disabled={disabled}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Regenerate response</TooltipContent>
      </Tooltip>
    </>
  );
}

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
  isEditing: boolean;
  isLoading: boolean;
  isLastMessage: boolean;
  copiedId: string | null;
  onStartEdit: (index: number, content: string) => void;
  onCancelEdit: () => void;
  onEditSubmit: (index: number, content: string) => void;
  onCopy: (id: string, content: string) => void;
  onRegenerate: (index: number) => void;
  onSelectFollowup: (question: string) => void;
  editInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

function ChatMessageComponent({
  message,
  index,
  isEditing,
  isLoading,
  isLastMessage,
  copiedId,
  onStartEdit,
  onCancelEdit,
  onEditSubmit,
  onCopy,
  onRegenerate,
  onSelectFollowup,
  editInputRef,
}: ChatMessageProps) {
  const messageId = `${message.timestamp}-${index}`;
  const isStreaming = isLoading && isLastMessage;

  // User messages: right-aligned, AI messages: left-aligned with icon
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            "group space-y-3",
            isEditing ? "w-full max-w-2xl" : "max-w-[80%]"
          )}
        >
          {isEditing ? (
            <MessageEditForm
              ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
              initialContent={message.content}
              onSubmit={(content) => onEditSubmit(index, content)}
              onCancel={onCancelEdit}
            />
          ) : (
            <div className="inline-block rounded-3xl bg-slate-200 dark:bg-slate-700 px-5 py-3.5 text-sm text-slate-900 dark:text-slate-100 shadow-sm selection:bg-slate-400/30 dark:selection:bg-slate-500/30 [&_strong]:font-semibold [&_p]:whitespace-pre-wrap">
              <MarkdownRenderer
                content={message.content}
                className="text-slate-900 dark:text-slate-100 [&_p]:text-slate-900 dark:[&_p]:text-slate-100 [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100 [&_a]:text-slate-700 dark:[&_a]:text-slate-300 [&_a]:underline"
              />
            </div>
          )}

          {/* User Message Actions */}
          {!isEditing && message.content && (
            <div className="flex justify-end gap-1 opacity-50 transition-opacity hover:opacity-100 group-hover:opacity-100 px-2">
              <UserMessageActions
                onEdit={() => onStartEdit(index, message.content)}
                onCopy={() => onCopy(`${index}-user`, message.content)}
                copied={copiedId === `${index}-user`}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message: left-aligned with icon
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
        <Bot className="h-4 w-4 text-primary" />
      </div>

      <div className="group space-y-3 max-w-[90%]">
        {message.content === "" && isLoading ? (
          <div className="rounded-2xl bg-muted/50 px-4 py-3">
            <TypingIndicator />
          </div>
        ) : (
          <div className="rounded-2xl bg-muted/50 px-4 py-3">
            <MarkdownRenderer
              content={message.content}
              sources={message.sources}
              enableCitationPreviews={true}
              isStreaming={isStreaming}
            />
          </div>
        )}

        {/* Sources and Trust Indicator */}
        {message.content && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              {!isStreaming && message.verification && (
                <TrustBadge
                  verification={message.verification}
                  confidenceInfo={message.confidence_info}
                />
              )}
              <SourceBadgeList sources={message.sources || []} />
              {!isStreaming && message.sources && message.sources.length > 0 && (
                <SourceTransparencyInline sources={message.sources} />
              )}
            </div>

            {/* Uncertainty disclaimer for unverified responses */}
            {!isStreaming && message.verification?.level === "unverified" && (
              <UncertaintyDisclaimer verification={message.verification} />
            )}

            {/* Why this confidence? (expandable) */}
            {!isStreaming && message.confidence_info && Object.keys(message.confidence_info.factors || {}).length > 0 && (
              <ConfidenceFactors confidenceInfo={message.confidence_info} />
            )}
          </div>
        )}

        {/* Suggested Follow-ups */}
        {message.suggested_followups && message.suggested_followups.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground">
              Related questions
            </p>
            <div className="flex flex-wrap gap-2">
              {message.suggested_followups.map((followup, fIndex) => (
                <button
                  key={fIndex}
                  onClick={() => onSelectFollowup(followup)}
                  className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                >
                  {followup}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Assistant Message Actions */}
        {message.content && (
          <div className="flex items-center gap-2 opacity-50 transition-opacity hover:opacity-100 group-hover:opacity-100">
            <div className="flex gap-1">
              <AssistantMessageActions
                messageId={messageId}
                content={message.content}
                copiedId={copiedId}
                onCopy={onCopy}
                onRegenerate={() => onRegenerate(index)}
                disabled={isLoading}
              />
            </div>
            {/* User feedback */}
            {!isStreaming && (
              <>
                <div className="w-px h-4 bg-border" aria-hidden="true" />
                <MessageFeedback messageId={messageId} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const ChatMessage = memo(ChatMessageComponent, (prevProps, nextProps) => {
  // Re-render if:
  // - message content changed
  // - message sources changed (citations arrive after streaming)
  // - editing state changed
  // - loading state changed for last message
  // - copied state changed for this message
  return (
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.sources === nextProps.message.sources &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isLastMessage === nextProps.isLastMessage &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.copiedId === nextProps.copiedId
  );
});
