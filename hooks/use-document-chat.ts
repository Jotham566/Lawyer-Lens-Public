"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChatMessage,
  ChatFeedbackType,
  ChatSource,
  ConfidenceInfo,
  ConversationDetail,
  ConversationSummary,
  Document,
  VerificationStatus,
} from "@/lib/api/types";
import { streamChatWithTypewriter, submitChatFeedback } from "@/lib/api";
import { getConversation, getConversations } from "@/lib/api/chat";

function buildStarterPrompts(document: Document | null): string[] {
  if (!document) return [];
  if (document.document_type === "judgment") {
    return [
      "Summarize this judgment.",
      "What issues did the court decide?",
      "What was the court's reasoning?",
      "What is the practical effect of this judgment?",
    ];
  }

  if (document.document_type === "act") {
    return [
      "What does this Act regulate and who does it apply to?",
      "What are the main obligations or compliance duties in this Act?",
      "What penalties, offences, or remedies should I know about?",
      "Which sections matter most in practice?",
    ];
  }

  return [
    "What does this document regulate?",
    "What are the key obligations in this document?",
    "What penalties, remedies, or enforcement rules are included?",
    "Which sections matter most in practice?",
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const restoreRequestRef = useRef(0);

  const starterPrompts = useMemo(() => buildStarterPrompts(document), [document]);

  const hydrateConversation = useCallback(async (targetConversationId: string, expectedDocumentId: string) => {
    const detail = await getConversation(targetConversationId);
    if (detail.scope?.document_id !== expectedDocumentId) return;

    setConversationId(detail.id);
    setMessages(
      detail.messages.map((message: ConversationDetail["messages"][number]) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        sources: message.citations,
        verification: message.verification || undefined,
        confidence_info: message.confidence_info || undefined,
        provider: message.provider || undefined,
        tokens_used: message.tokens_used,
      }))
    );
  }, []);

  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setInput("");
    setMessages([]);
    setConversationId(null);
    setIsLoading(false);
    setIsGenerating(false);
    setError(null);
    setCopiedId(null);

    if (!document?.id) {
      return;
    }

    const requestId = ++restoreRequestRef.current;
    let cancelled = false;

    const restoreScopedConversation = async () => {
      try {
        const { conversations } = await getConversations(100, 0);
        if (cancelled || restoreRequestRef.current !== requestId) return;

        const scopedConversation = conversations
          .filter(
            (conversation: ConversationSummary) =>
              !conversation.is_archived &&
              conversation.scope?.document_id === document.id
          )
          .sort(
            (left: ConversationSummary, right: ConversationSummary) =>
              new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
          )[0];

        if (!scopedConversation) return;

        await hydrateConversation(scopedConversation.id, document.id);
      } catch (restoreError) {
        console.error("Failed to restore document chat conversation:", restoreError);
      }
    };

    void restoreScopedConversation();

    const handleVisibilityRefresh = () => {
      if (globalThis.document.visibilityState === "hidden") return;
      void restoreScopedConversation();
    };

    window.addEventListener("focus", handleVisibilityRefresh);
    globalThis.document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleVisibilityRefresh);
      globalThis.document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [document?.id, hydrateConversation]);

  const runDocumentScopedStream = useCallback(
    async (text: string, visibleMessages: ChatMessage[], truncateFrom?: number) => {
      if (!document) return;

      const assistantPlaceholder = createAssistantPlaceholder();
      const historyBeforeSend = visibleMessages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      setError(null);
      setIsLoading(true);
      setIsGenerating(true);
      setMessages([...visibleMessages, assistantPlaceholder]);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      let activeConversationId = conversationId;

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
            truncate_from: truncateFrom,
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
              activeConversationId = event.id;
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
        if (!controller.signal.aborted && activeConversationId && document?.id) {
          try {
            await hydrateConversation(activeConversationId, document.id);
          } catch (hydrateError) {
            console.error("Failed to rehydrate document chat conversation:", hydrateError);
          }
        }
        abortControllerRef.current = null;
        setIsGenerating(false);
        setIsLoading(false);
      }
    },
    [conversationId, document, hydrateConversation]
  );

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

      setInput("");
      await runDocumentScopedStream(text, [...messages, userMessage]);
    },
    [document, input, isLoading, messages, runDocumentScopedStream]
  );

  const regenerateMessage = useCallback(
    async (assistantIndex: number) => {
      if (isLoading || assistantIndex <= 0) return;

      const assistantMessage = messages[assistantIndex];
      const userMessage = messages[assistantIndex - 1];

      if (!assistantMessage || assistantMessage.role !== "assistant") return;
      if (!userMessage || userMessage.role !== "user") return;

      // Truncate from the user message index so backend deletes old user+assistant pair
      const userMessageIndex = assistantIndex - 1;
      const retainedMessages = messages.slice(0, assistantIndex);
      await runDocumentScopedStream(userMessage.content, retainedMessages, userMessageIndex);
    },
    [isLoading, messages, runDocumentScopedStream]
  );

  const editAndResubmit = useCallback(
    async (messageIndex: number, newContent: string) => {
      if (isLoading || !newContent.trim()) return;

      const originalMessage = messages[messageIndex];
      if (!originalMessage || originalMessage.role !== "user") return;

      const trimmed = newContent.trim();
      if (trimmed === originalMessage.content) return;

      // Keep messages before the edited one, then add the edited user message
      const messagesBefore = messages.slice(0, messageIndex);
      const editedUser: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      // Truncate from the edited message index so backend deletes old messages
      await runDocumentScopedStream(trimmed, [...messagesBefore, editedUser], messageIndex);
    },
    [isLoading, messages, runDocumentScopedStream]
  );

  const startNewChat = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setInput("");
    setMessages([]);
    setConversationId(null);
    setIsLoading(false);
    setIsGenerating(false);
    setError(null);
    setCopiedId(null);
  }, []);

  const copyMessage = useCallback(async (messageId: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    window.setTimeout(() => setCopiedId((current) => (current === messageId ? null : current)), 2000);
  }, []);

  const submitFeedback = useCallback(
    async (payload: {
      messageId: string;
      type: ChatFeedbackType;
      reason?: string;
      timestamp: string;
    }) => {
      await submitChatFeedback({
        message_id: payload.messageId,
        feedback_type: payload.type,
        reason: payload.reason,
        metadata: {
          submitted_at: payload.timestamp,
          surface: "document_chat",
          document_id: document?.id,
          conversation_id: conversationId,
        },
      });
    },
    [conversationId, document?.id]
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
    copiedId,
    starterPrompts,
    sendMessage,
    regenerateMessage,
    editAndResubmit,
    startNewChat,
    copyMessage,
    submitFeedback,
    stop,
  };
}
