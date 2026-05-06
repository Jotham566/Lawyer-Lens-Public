"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers";
import { toast } from "sonner";
import {
  chatWithKnowledgeBase,
  type KbChatCitation,
  type KbChatResponse,
  type KbChatTurn,
} from "@/lib/api/knowledge-base";

/* ─────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────── */

interface ChatTurnUI {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: KbChatCitation[];
  hallucinationScore?: number | null;
  citationCoverage?: number | null;
  isLoading?: boolean;
}

/* ─────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────── */

function GroundingBadge({
  hallucinationScore,
  citationCoverage,
}: {
  hallucinationScore?: number | null;
  citationCoverage?: number | null;
}) {
  // Combine the two signals into a single "grounding" indicator. If we
  // don't have either signal, render nothing.
  if (hallucinationScore == null && citationCoverage == null) return null;
  // Use whichever signal is available; both are 0-1.
  const score = hallucinationScore ?? citationCoverage ?? 0;
  let label = "Unverified";
  let tone = "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
  if (score >= 0.85) {
    label = "Highly grounded";
    tone =
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  } else if (score >= 0.6) {
    label = "Mostly grounded";
    tone =
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  } else if (score > 0) {
    label = "Lightly grounded";
    tone = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone,
      )}
      title={`hallucination_score=${(hallucinationScore ?? -1).toFixed(2)} · citation_coverage=${(citationCoverage ?? -1).toFixed(2)}`}
    >
      {label}
    </span>
  );
}

function CitationCard({ c }: { c: KbChatCitation }) {
  const pct = Math.round(c.score * 100);
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-foreground">
          {c.document_title}
          {c.page_number ? (
            <span className="ml-1 text-muted-foreground">· p. {c.page_number}</span>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-brand-gold/20 px-2 py-0.5 text-[11px] font-semibold text-foreground">
          {pct}% match
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-muted-foreground">
        {c.chunk_text}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────── */

export function KbChatPanel() {
  const { isAuthenticated } = useAuth();
  const [turns, setTurns] = useState<ChatTurnUI[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new turn
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns]);

  const handleSend = async () => {
    const question = input.trim();
    if (!isAuthenticated || !question || pending) return;
    setInput("");
    const userTurn: ChatTurnUI = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
    };
    const placeholderTurn: ChatTurnUI = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      isLoading: true,
    };
    setTurns((prev) => [...prev, userTurn, placeholderTurn]);
    setPending(true);
    try {
      // Build conversation history from prior turns (exclude the new question)
      const history: KbChatTurn[] = turns.map((t) => ({
        role: t.role,
        content: t.content,
      }));
      const resp: KbChatResponse = await chatWithKnowledgeBase(
        question,
        history,
      );
      setTurns((prev) => {
        const next = [...prev];
        const idx = next.findIndex((t) => t.id === placeholderTurn.id);
        if (idx >= 0) {
          next[idx] = {
            id: placeholderTurn.id,
            role: "assistant",
            content: resp.answer,
            citations: resp.citations,
            hallucinationScore: resp.hallucination_score,
            citationCoverage: resp.citation_coverage,
          };
        }
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Chat request failed", { description: msg });
      setTurns((prev) => prev.filter((t) => t.id !== placeholderTurn.id));
    } finally {
      setPending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  /* ─────────────────────────────────────
     Empty state
     ───────────────────────────────────── */
  if (turns.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="rounded-full bg-brand-gold/10 p-4">
            <Sparkles className="h-7 w-7 text-brand-gold" />
          </div>
          <h3 className="text-xl font-semibold">Ask your Knowledge Base</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Get plain-English answers grounded in your organization&apos;s
            documents. Every answer cites the source doc + page.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            "What's in our knowledge base?",
            "Summarize the main themes across our documents",
            "What are the key findings in our reports?",
            "Find documents about wearable technology",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setInput(suggestion);
              }}
              className="rounded-lg border border-border/60 bg-card px-3 py-2 text-left text-sm text-foreground/80 transition hover:border-brand-gold hover:bg-brand-gold/5"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 shadow-sm focus-within:border-brand-gold focus-within:ring-1 focus-within:ring-brand-gold">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your knowledge base..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || pending}
            className="rounded-full"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────
     Conversation view
     ───────────────────────────────────── */
  return (
    <div className="flex h-[calc(100vh-280px)] min-h-[480px] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {turns.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex",
              t.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                t.role === "user"
                  ? "bg-foreground text-background"
                  : "bg-card text-foreground border border-border/60",
              )}
            >
              {t.isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching your knowledge base...</span>
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {t.content}
                  </div>
                  {t.role === "assistant" && (
                    <GroundingBadge
                      hallucinationScore={t.hallucinationScore}
                      citationCoverage={t.citationCoverage}
                    />
                  )}
                  {t.role === "assistant" &&
                    t.citations &&
                    t.citations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Sources ({t.citations.length})
                        </div>
                        <div className="space-y-2">
                          {t.citations.slice(0, 5).map((c) => (
                            <CitationCard key={c.document_id + c.chunk_text.slice(0, 20)} c={c} />
                          ))}
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 bg-card/30 p-4">
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 shadow-sm focus-within:border-brand-gold focus-within:ring-1 focus-within:ring-brand-gold">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            disabled={pending}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || pending}
            className="rounded-full"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Press Enter to send · Shift+Enter for newline · Answers may
          contain inaccuracies — verify with the cited sources.
        </p>
      </div>
    </div>
  );
}
