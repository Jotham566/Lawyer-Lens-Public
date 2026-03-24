"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  FileText,
  MessageSquare,
  RefreshCw,
  Send,
  Square,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/chat";
import {
  ConfidenceFactors,
  SourceTransparencyInline,
  TrustBadge,
  TrustIndicatorPanel,
  UncertaintyDisclaimer,
} from "@/components/chat";
import { MessageFeedback } from "@/components/chat/message-feedback";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { ChatFeedbackType, ChatMessage, ChatSource, Document } from "@/lib/api/types";

interface DocumentChatPanelProps {
  document: Document;
  input: string;
  messages: ChatMessage[];
  conversationId: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  copiedId: string | null;
  starterPrompts: string[];
  onInputChange: (value: string) => void;
  onSend: (message?: string) => Promise<void>;
  onStop: () => void;
  onCopy: (messageId: string, content: string) => Promise<void>;
  onRegenerate: (messageIndex: number) => Promise<void>;
  onFeedback: (payload: {
    messageId: string;
    type: ChatFeedbackType;
    reason?: string;
    timestamp: string;
  }) => Promise<void>;
  onSelectCitation?: (citation: ChatSource) => void;
  onSelectFollowup?: (question: string) => void;
  onClose?: () => void;
  className?: string;
}

function SourceChip({
  source,
  index,
  onClick,
}: {
  source: ChatSource;
  index: number;
  onClick?: (source: ChatSource) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(source)}
      className={cn("group flex items-start gap-2 px-2.5 py-2 text-left text-xs", surfaceClasses.rowInteractive)}
    >
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0">
        <div className="line-clamp-1 font-medium text-foreground">{source.title}</div>
        <div className="mt-0.5 line-clamp-1 text-muted-foreground">
          {source.legal_reference || source.section || source.human_readable_id}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({
  message,
  index,
  isStreaming = false,
  copiedId,
  onCopy,
  onRegenerate,
  onFeedback,
  onSelectCitation,
  onSelectFollowup,
}: {
  message: ChatMessage;
  index: number;
  isStreaming?: boolean;
  copiedId: string | null;
  onCopy: (messageId: string, content: string) => Promise<void>;
  onRegenerate: (messageIndex: number) => Promise<void>;
  onFeedback: (payload: {
    messageId: string;
    type: ChatFeedbackType;
    reason?: string;
    timestamp: string;
  }) => Promise<void>;
  onSelectCitation?: (citation: ChatSource) => void;
  onSelectFollowup?: (question: string) => void;
}) {
  const isAssistant = message.role === "assistant";
  const [showTrustDetails, setShowTrustDetails] = useState(
    message.verification?.level === "unverified"
  );
  const copyKey = message.id || `${message.role}-${index}`;

  return (
    <div className={cn("flex", isAssistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "group max-w-[96%] text-sm",
          isAssistant
            ? "rounded-2xl border bg-card px-4 py-3 text-card-foreground shadow-sm"
            : "space-y-2"
        )}
      >
        {isAssistant ? (
            <div className="space-y-3">
            <MarkdownRenderer
              content={message.content || "Thinking..."}
              sources={message.sources}
              enableCitationPreviews={true}
              isStreaming={isStreaming}
              className="[&_p]:mb-3 [&_p]:text-[14px] [&_p]:leading-6 [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-lg [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[15px] [&_ul]:mb-3 [&_ul]:space-y-1.5 [&_ul]:text-[14px] [&_ul]:leading-6 [&_ol]:mb-3 [&_ol]:space-y-1.5 [&_ol]:text-[14px] [&_ol]:leading-6"
            />
            {message.verification && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <TrustBadge
                    verification={message.verification}
                    confidenceInfo={message.confidence_info}
                  />
                  {message.sources && message.sources.length > 0 && (
                    <SourceTransparencyInline sources={message.sources} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowTrustDetails((value) => !value)}
                  className={cn("inline-flex items-center gap-1 text-xs font-medium", surfaceClasses.textLink)}
                >
                  Why this answer
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      showTrustDetails && "rotate-180"
                    )}
                  />
                </button>
                {showTrustDetails && (
                  <div className="space-y-2">
                    <TrustIndicatorPanel
                      verification={message.verification}
                      confidenceInfo={message.confidence_info}
                    />
                    {message.confidence_info &&
                      Object.keys(message.confidence_info.factors || {}).length > 0 && (
                      <ConfidenceFactors confidenceInfo={message.confidence_info} />
                    )}
                    {message.verification.level === "unverified" && (
                      <UncertaintyDisclaimer verification={message.verification} />
                    )}
                  </div>
                )}
              </div>
            )}
            {message.sources && message.sources.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Sources used
                </div>
                <div className="grid gap-2">
                {message.sources.slice(0, 3).map((source, index) => (
                  <SourceChip
                    key={`${source.document_id}-${source.chunk_id || index}`}
                    index={index}
                    source={source}
                    onClick={onSelectCitation}
                  />
                ))}
                </div>
              </div>
            )}
            {message.suggested_followups &&
              message.suggested_followups.length > 0 &&
              onSelectFollowup && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Keep exploring
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {message.suggested_followups.slice(0, 3).map((followup) => (
                    <button
                      key={followup}
                      type="button"
                      onClick={() => onSelectFollowup(followup)}
                      className={surfaceClasses.chipButton}
                    >
                      {followup}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {message.content && (
              <div className="flex items-center gap-2 border-t pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", surfaceClasses.iconButton)}
                  onClick={() => void onCopy(copyKey, message.content)}
                >
                  {copiedId === copyKey ? (
                    <Check className="h-3.5 w-3.5 text-secondary-foreground" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                {!isStreaming && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", surfaceClasses.iconButton)}
                    onClick={() => void onRegenerate(index)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
                {!isStreaming && (
                  <MessageFeedback
                    messageId={message.id || copyKey}
                    disabled={!message.id}
                    disabledReason="Feedback is available once this response is fully saved."
                    onFeedback={onFeedback}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="inline-block rounded-3xl bg-surface-container-high px-5 py-3.5 text-sm text-foreground shadow-sm">
              <p className="whitespace-pre-wrap leading-relaxed selection:bg-primary/28 dark:selection:bg-primary/24 dark:selection:text-[#fff7e7] selection:text-inherit">
                {message.content}
              </p>
            </div>
            {message.content && (
              <div className="flex justify-end px-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7 opacity-60 transition-opacity hover:opacity-100 group-hover:opacity-100", surfaceClasses.iconButton)}
                  onClick={() => void onCopy(copyKey, message.content)}
                >
                  {copiedId === copyKey ? (
                    <Check className="h-3.5 w-3.5 text-secondary-foreground" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DocumentChatPanel({
  document,
  input,
  messages,
  conversationId,
  isLoading,
  isGenerating,
  error,
  copiedId,
  starterPrompts,
  onInputChange,
  onSend,
  onStop,
  onCopy,
  onRegenerate,
  onFeedback,
  onSelectCitation,
  onSelectFollowup,
  onClose,
  className,
}: DocumentChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport instanceof HTMLElement) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const title = useMemo(() => {
    const typeLabel = document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1);
    return `${typeLabel} chat`;
  }, [document.document_type]);

  return (
    <Card className={cn("flex h-full min-h-0 flex-col overflow-hidden border-border/70", className)}>
      <CardHeader className="border-b bg-surface-container-low px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm">{title}</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                Scoped
              </Badge>
              <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                Strict
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                Grounded in this document only
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conversationId ? (
              <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" asChild>
                <Link href={`/chat?conversation=${encodeURIComponent(conversationId)}`}>
                  Open in full chat
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : null}
            {onClose ? (
              <Button variant="ghost" size="icon" className={cn("h-8 w-8", surfaceClasses.iconButton)} onClick={onClose}>
                <X className="ll-icon-muted h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border bg-background px-3 py-2">
          <p className="line-clamp-2 text-sm font-medium leading-snug">{document.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {[
              document.chapter ? `Cap. ${document.chapter}` : null,
              document.case_number,
              document.court_level,
              document.act_year || (document.publication_date ? new Date(document.publication_date).getFullYear() : null),
            ].filter(Boolean).join(" · ") || document.document_type}
          </p>
        </div>
      </CardHeader>

      <ScrollArea ref={scrollRef} className="flex-1">
        <CardContent className="space-y-4 p-3.5">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed bg-surface-container-low p-3.5 text-sm text-muted-foreground">
                Ask focused questions about this document without losing your place in the reader.
              </div>
              <div className="grid gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void onSend(prompt)}
                    className={cn("rounded-xl border bg-background px-3.5 py-3 text-left text-sm", surfaceClasses.rowInteractive)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id || `${message.role}-${index}`}
                  message={message}
                  index={index}
                  isStreaming={isGenerating && index === messages.length - 1}
                  copiedId={copiedId}
                  onCopy={onCopy}
                  onRegenerate={onRegenerate}
                  onFeedback={onFeedback}
                  onSelectCitation={onSelectCitation}
                  onSelectFollowup={onSelectFollowup}
                />
              ))}
            </div>
          )}
        </CardContent>
      </ScrollArea>

      <div className="border-t bg-background p-3.5">
        {error ? (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSend();
          }}
          className="space-y-3"
        >
          <Textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void onSend();
              }
            }}
            placeholder={`Ask about this ${document.document_type}...`}
            className="min-h-[80px] resize-none !border-0 !border-b-0 bg-transparent !shadow-none ring-1 ring-border/40 focus-visible:ring-2 focus-visible:ring-primary/50 dark:ring-glass dark:focus-visible:ring-brand-gold/40 text-foreground placeholder:text-muted-foreground/70 selection:bg-primary/28 dark:selection:bg-primary/24 dark:selection:text-[#fff7e7] selection:text-foreground"
          />
          <div className="pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Citations stay anchored to this document
            </div>
            {isGenerating ? (
              <Button type="button" variant="destructive" size="sm" onClick={onStop}>
                <Square className="mr-2 h-4 w-4 fill-current" />
                Stop
              </Button>
            ) : (
              <Button type="submit" size="sm" disabled={!input.trim() || isLoading}>
                <Send className="mr-2 h-4 w-4" />
                Ask
              </Button>
            )}
          </div>
          </div>
        </form>
      </div>
    </Card>
  );
}
