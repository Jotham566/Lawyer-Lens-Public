"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  ChatMessage,
  ChatSource,
  ConfidenceInfo,
  Document,
  VerificationStatus,
} from "@/lib/api/types";
import { streamChatWithTypewriter } from "@/lib/api";

function buildStarterPrompts(document: Document | null): string[] {
  if (!document) return [];
  if (document.document_type === "judgment") {
    return [
      "Summarize the holding in this judgment.",
      "What issues did the court decide?",
      "What was the court's reasoning?",
      "What is the practical effect of this judgment?",
    ];
  }

  return [
    "Summarize this document.",
    "What are the key obligations in this document?",
    "What penalties or remedies does this document provide?",
    "Explain the most important sections in this document.",
  ];
}

function createAssistantPlaceholder(): ChatMessage {
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content: "",
    timestamp: new Date().toISOString(),
  };
}

function updateAssistantMessage(
  message: ChatMessage,
  updates: {
    content?: string;
    sources?: ChatSource[];
    verification?: VerificationStatus;
    confidence_info?: ConfidenceInfo;
    suggested_followups?: string[];
    id?: string;
  }
): ChatMessage {
  return {
    ...message,
    ...(updates.id ? { id: updates.id } : {}),
    ...(updates.content !== undefined ? { content: updates.content } : {}),
    ...(updates.sources !== undefined ? { sources: updates.sources } : {}),
    ...(updates.verification !== undefined ? { verification: updates.verification } : {}),
    ...(updates.confidence_info !== undefined
      ? { confidence_info: updates.confidence_info }
      : {}),
    ...(updates.suggested_followups !== undefined
      ? { suggested_followups: updates.suggested_followups }
      : {}),
  };
}

export function useDocumentChat(document: Document | null) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const starterPrompts = useMemo(() => buildStarterPrompts(document), [document]);

  const sendMessage = useCallback(
    async (rawMessage?: string) => {
      const text = (rawMessage ?? input).trim();
      if (!document || !text || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      const assistantPlaceholder = createAssistantPlaceholder();
      const historyBeforeSend = [...messages, userMessage].map((message) => ({
        role: message.role,
        content: message.content,
      }));

      setInput("");
      setError(null);
      setIsLoading(true);
      setIsGenerating(true);
      setMessages((current) => [...current, userMessage, assistantPlaceholder]);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        let fullContent = "";
        let sources: ChatSource[] = [];
        let verification: VerificationStatus | undefined;
        let confidenceInfo: ConfidenceInfo | undefined;
        let suggestedFollowups: string[] = [];
        let assistantMessageId: string | undefined;

        const stream = streamChatWithTypewriter(
          {
            message: text,
            conversation_id: conversationId || undefined,
            conversation_history: historyBeforeSend,
            document_scope: {
              document_id: document.id,
              mode: "strict",
            },
            search_mode: "hybrid",
            max_context_chunks: 10,
            temperature: 0.3,
          },
          {},
          controller.signal
        );

        for await (const event of stream) {
          switch (event.type) {
            case "content":
              fullContent += event.text;
              setMessages((current) => {
                const next = [...current];
                next[next.length - 1] = updateAssistantMessage(next[next.length - 1], {
                  content: fullContent,
                });
                return next;
              });
              break;
            case "content_update":
              fullContent = event.fullContent;
              setMessages((current) => {
                const next = [...current];
                next[next.length - 1] = updateAssistantMessage(next[next.length - 1], {
                  content: fullContent,
                });
                return next;
              });
              break;
            case "citations":
              sources = event.citations;
              setMessages((current) => {
                const next = [...current];
                next[next.length - 1] = updateAssistantMessage(next[next.length - 1], {
                  content: fullContent,
                  sources,
                  verification,
                  confidence_info: confidenceInfo,
                  suggested_followups:
                    suggestedFollowups.length > 0 ? suggestedFollowups : undefined,
                });
                return next;
              });
              break;
            case "verification":
              verification = event.data.verification;
              confidenceInfo = event.data.confidence_info;
              setMessages((current) => {
                const next = [...current];
                next[next.length - 1] = updateAssistantMessage(next[next.length - 1], {
                  content: fullContent,
                  sources,
                  verification,
                  confidence_info: confidenceInfo,
                  suggested_followups:
                    suggestedFollowups.length > 0 ? suggestedFollowups : undefined,
                });
                return next;
              });
              break;
            case "followups":
              suggestedFollowups = event.questions;
              setMessages((current) => {
                const next = [...current];
                next[next.length - 1] = updateAssistantMessage(next[next.length - 1], {
                  content: fullContent,
                  sources,
                  verification,
                  confidence_info: confidenceInfo,
                  suggested_followups: suggestedFollowups,
                });
                return next;
              });
              break;
            case "message_id":
              assistantMessageId = event.id;
              setMessages((current) => {
                const next = [...current];
                next[next.length - 1] = updateAssistantMessage(next[next.length - 1], {
                  id: assistantMessageId,
                  content: fullContent,
                  sources,
                  verification,
                  confidence_info: confidenceInfo,
                  suggested_followups:
                    suggestedFollowups.length > 0 ? suggestedFollowups : undefined,
                });
                return next;
              });
              break;
            case "conversation_id":
              setConversationId(event.id);
              break;
            case "generation_done":
              setIsGenerating(false);
              break;
            case "error":
              setError(event.message);
              break;
            case "done":
              break;
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "Failed to get response");
        }
      } finally {
        abortControllerRef.current = null;
        setIsGenerating(false);
        setIsLoading(false);
      }
    },
    [conversationId, document, input, isLoading, messages]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
    setIsLoading(false);
  }, []);

  return {
    input,
    setInput,
    messages,
    conversationId,
    isLoading,
    isGenerating,
    error,
    starterPrompts,
    sendMessage,
    stop,
  };
}
