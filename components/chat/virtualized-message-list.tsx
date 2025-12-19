"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChatMessage } from "./chat-message";
import { AlertCircle } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/api/types";

interface VirtualizedMessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  editingIndex: number | null;
  copiedId: string | null;
  onStartEdit: (index: number, content: string) => void;
  onCancelEdit: () => void;
  onEditSubmit: (index: number, content: string) => void;
  onCopy: (id: string, content: string) => void;
  onRegenerate: (index: number) => void;
  onSelectFollowup: (question: string) => void;
  editInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

// Minimum height estimate for messages (will be measured dynamically)
const ESTIMATED_MESSAGE_HEIGHT = 120;

// Threshold for number of messages before enabling virtualization
const VIRTUALIZATION_THRESHOLD = 20;

export function VirtualizedMessageList({
  messages,
  isLoading,
  error,
  editingIndex,
  copiedId,
  onStartEdit,
  onCancelEdit,
  onEditSubmit,
  onCopy,
  onRegenerate,
  onSelectFollowup,
  editInputRef,
}: VirtualizedMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousMessageCount = useRef(messages.length);

  // Track if user has scrolled up from bottom
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }, []);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: messages.length + (error ? 1 : 0), // Add 1 for error item if present
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_MESSAGE_HEIGHT,
    overscan: 5, // Render 5 extra items above/below viewport
    getItemKey: (index) => {
      if (index >= messages.length) return "error-item";
      const message = messages[index];
      return `${message.timestamp}-${index}`;
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > previousMessageCount.current && shouldAutoScroll) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        // Safety check: only scroll if we have messages and virtualizer is ready
        if (messages.length > 0 && parentRef.current) {
          try {
            virtualizer.scrollToIndex(messages.length - 1, {
              align: "end",
              behavior: "smooth",
            });
          } catch {
            // Fallback: scroll container directly if virtualizer fails
            if (parentRef.current) {
              parentRef.current.scrollTo({
                top: parentRef.current.scrollHeight,
                behavior: "smooth",
              });
            }
          }
        }
      });
    }
    previousMessageCount.current = messages.length;
  }, [messages.length, shouldAutoScroll, virtualizer]);

  // Scroll to bottom during streaming
  useEffect(() => {
    if (isLoading && shouldAutoScroll && messages.length > 0) {
      const scrollInterval = setInterval(() => {
        if (parentRef.current) {
          const { scrollHeight, clientHeight } = parentRef.current;
          parentRef.current.scrollTo({
            top: scrollHeight - clientHeight,
            behavior: "smooth",
          });
        }
      }, 100);

      return () => clearInterval(scrollInterval);
    }
  }, [isLoading, shouldAutoScroll, messages.length]);

  // Re-measure items when editing state changes
  useEffect(() => {
    if (editingIndex !== null) {
      virtualizer.measure();
    }
  }, [editingIndex, virtualizer]);

  // Auto-scroll for non-virtualized list when new messages or content changes
  useEffect(() => {
    if (messages.length < VIRTUALIZATION_THRESHOLD && shouldAutoScroll && parentRef.current) {
      const scrollToBottom = () => {
        if (parentRef.current) {
          parentRef.current.scrollTo({
            top: parentRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      };
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(scrollToBottom);
    }
  }, [messages, shouldAutoScroll]);

  // For small message lists, render without virtualization
  if (messages.length < VIRTUALIZATION_THRESHOLD) {
    return (
      <div
        ref={parentRef}
        className="h-full overflow-auto"
        onScroll={handleScroll}
      >
        <div className="mx-auto max-w-3xl px-4 py-6" role="log" aria-live="polite" aria-atomic="false">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <ChatMessage
                key={`${message.timestamp}-${index}`}
                message={message}
                index={index}
                isEditing={editingIndex === index}
                isLoading={isLoading}
                isLastMessage={index === messages.length - 1}
                copiedId={copiedId}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onEditSubmit={onEditSubmit}
                onCopy={onCopy}
                onRegenerate={onRegenerate}
                onSelectFollowup={onSelectFollowup}
                editInputRef={editInputRef}
              />
            ))}

            {error && (
              <div className="flex gap-4" role="alert" aria-live="assertive">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                </div>
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Virtualized rendering for long conversations
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      <div
        className="relative mx-auto max-w-3xl px-4 py-6"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualItems.map((virtualItem) => {
          const isErrorItem = virtualItem.index >= messages.length;

          if (isErrorItem && error) {
            return (
              <div
                key="error-item"
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 right-0 px-4"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="flex gap-4 py-3" role="alert" aria-live="assertive">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                  </div>
                  <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                </div>
              </div>
            );
          }

          const message = messages[virtualItem.index];
          if (!message) return null;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 right-0 px-4"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="py-3">
                <ChatMessage
                  message={message}
                  index={virtualItem.index}
                  isEditing={editingIndex === virtualItem.index}
                  isLoading={isLoading}
                  isLastMessage={virtualItem.index === messages.length - 1}
                  copiedId={copiedId}
                  onStartEdit={onStartEdit}
                  onCancelEdit={onCancelEdit}
                  onEditSubmit={onEditSubmit}
                  onCopy={onCopy}
                  onRegenerate={onRegenerate}
                  onSelectFollowup={onSelectFollowup}
                  editInputRef={editInputRef}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
