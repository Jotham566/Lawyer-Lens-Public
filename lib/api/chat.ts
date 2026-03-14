/**
 * Chat API
 *
 * Functions for Legal Assistant interactions.
 */

import { apiFetch, apiPost, apiGet, getApiBaseUrl, getCsrfToken } from "./client";
import type {
  ChatRequest,
  ChatResponse,
  ChatFeedbackRequest,
  ChatFeedbackResponse,
  ChatSource,
  VerificationStatus,
  ConfidenceInfo,
  ConversationListResponse,
  ConversationDetail,
} from "./types";

function sanitizeChatRequest(request: ChatRequest): ChatRequest {
  const cleanMessage = request.message.trim();
  const cleanConversationId = request.conversation_id?.trim() || undefined;
  const cleanHistory = (request.conversation_history || [])
    .filter(
      (item): item is { role: string; content: string } =>
        Boolean(item) &&
        typeof item.role === "string" &&
        typeof item.content === "string"
    )
    .map((item) => ({
      role: item.role.trim().toLowerCase(),
      content: item.content.trim(),
    }))
    .filter(
      (item) =>
        item.content.length > 0 &&
        (item.role === "user" || item.role === "assistant" || item.role === "system")
    );

  return {
    ...request,
    message: cleanMessage,
    conversation_id: cleanConversationId,
    conversation_history: cleanHistory,
    document_scope: request.document_scope
      ? {
          document_id: request.document_scope.document_id.trim(),
          mode: request.document_scope.mode,
        }
      : undefined,
    search_mode: request.search_mode?.trim?.().toLowerCase() as ChatRequest["search_mode"] | undefined,
  };
}

/**
 * Chat health response type
 */
interface ChatHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  providers: {
    gemini?: { available: boolean; model?: string; error?: string };
    local_mlx?: { available: boolean; model?: string; error?: string };
  };
}

/**
 * Send a message to the Legal Assistant
 */
export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  return apiPost<ChatResponse>("/chat", sanitizeChatRequest(request));
}

/**
 * Check chat service health
 */
export async function getChatHealth(): Promise<ChatHealthResponse> {
  return apiGet<ChatHealthResponse>("/chat/health");
}

/**
 * Get user's conversation history
 */
export async function getConversations(
  limit: number = 50,
  offset: number = 0
): Promise<ConversationListResponse> {
  return apiGet<ConversationListResponse>(
    `/chat/conversations?limit=${limit}&offset=${offset}`
  );
}

/**
 * Get full conversation details
 */
export async function getConversation(
  conversationId: string
): Promise<ConversationDetail> {
  return apiGet<ConversationDetail>(`/chat/conversations/${conversationId}`);
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  await apiFetch<void>(`/chat/conversations/${conversationId}`, {
    method: "DELETE",
  });
}

/**
 * Update a conversation's properties (title, starred status, archived status)
 */
export async function updateConversation(
  conversationId: string,
  updates: { title?: string; is_starred?: boolean; is_archived?: boolean }
): Promise<{ id: string; title: string; is_starred: boolean; is_archived: boolean }> {
  return apiFetch<{ id: string; title: string; is_starred: boolean; is_archived: boolean }>(
    `/chat/conversations/${conversationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );
}

/**
 * Update a conversation's title (convenience wrapper)
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<{ id: string; title: string }> {
  return updateConversation(conversationId, { title });
}

/**
 * Submit feedback for an assistant chat response
 */
export async function submitChatFeedback(
  request: ChatFeedbackRequest
): Promise<ChatFeedbackResponse> {
  return apiPost<ChatFeedbackResponse>("/chat/feedback", request);
}


/**
 * Verification data from the stream
 */
export interface StreamVerificationData {
  verification: VerificationStatus;
  confidence_info: ConfidenceInfo;
}

export interface StreamErrorMetadata {
  retryable?: boolean;
  retry_after_ms?: number;
  reason_code?: string;
  provider?: string | null;
  trace_id?: string;
}

/**
 * Stream event types from the chat API
 */
export type StreamEvent =
  | { type: "content"; text: string }
  | { type: "content_update"; fullContent: string }
  | { type: "citations"; citations: ChatSource[] }
  | { type: "verification"; data: StreamVerificationData }
  | { type: "generation_done" }
  | { type: "message_id"; id: string }
  | { type: "conversation_id"; id: string }
  | { type: "followups"; questions: string[] }
  | { type: "done" }
  | ({ type: "error"; message: string } & StreamErrorMetadata);

/**
 * Configuration for typing animation
 */
interface TypewriterConfig {
  /** Characters to reveal per tick (default: 3) */
  charsPerTick?: number;
  /** Delay between ticks in ms (default: 10) */
  tickDelay?: number;
}

/**
 * Stream chat with typewriter effect
 * Buffers incoming content and reveals it gradually for a typing animation
 * @param request - Chat request parameters
 * @param config - Typewriter animation config
 * @param accessToken - Optional access token for authenticated requests (enables usage tracking)
 */
export async function* streamChatWithTypewriter(
  request: ChatRequest,
  config: TypewriterConfig = {},
  signal?: AbortSignal
): AsyncGenerator<StreamEvent, void, unknown> {
  const { charsPerTick = 10, tickDelay = 10 } = config;

  // Queue-based approach: metadata events are pushed here by the stream consumer
  // and drained by the typewriter tick loop, so they reach React immediately.
  const pendingEvents: StreamEvent[] = [];

  const state = {
    contentBuffer: "",
    revealedLength: 0,
    isStreaming: true,
    errorMessage: null as string | null,
  };

  // Start the stream — metadata events go into pendingEvents immediately
  const streamPromise = (async () => {
    for await (const event of streamChatMessage(request, signal)) {
      if (event.type === "content") {
        state.contentBuffer += event.text;
      } else if (event.type === "done") {
        state.isStreaming = false;
      } else if (event.type === "error") {
        state.isStreaming = false;
        state.errorMessage = event.message;
      } else {
        // All other events (content_update, citations, verification,
        // generation_done, message_id, conversation_id, followups)
        // are pushed to the queue for immediate delivery
        pendingEvents.push(event);
      }
    }
    state.isStreaming = false;
  })();

  // Reveal content gradually, draining metadata events each tick
  while ((state.isStreaming || state.revealedLength < state.contentBuffer.length) && !signal?.aborted) {
    // Drain any pending metadata events first — these reach React immediately
    while (pendingEvents.length > 0) {
      yield pendingEvents.shift()!;
    }

    if (state.revealedLength < state.contentBuffer.length) {
      const nextLength = Math.min(state.revealedLength + charsPerTick, state.contentBuffer.length);
      const newText = state.contentBuffer.slice(state.revealedLength, nextLength);
      state.revealedLength = nextLength;
      yield { type: "content", text: newText };
    }

    // Small delay for typing effect
    await new Promise(resolve => setTimeout(resolve, tickDelay));
  }

  // Wait for stream to complete (should already be done at this point)
  await streamPromise;

  // Drain any remaining events that arrived after typing finished
  while (pendingEvents.length > 0) {
    yield pendingEvents.shift()!;
  }

  // Send error if one occurred (yield instead of throw to avoid dev overlay)
  if (state.errorMessage) {
    yield { type: "error", message: state.errorMessage };
  }

  yield { type: "done" };
}

/**
 * Stream chat response (for real-time typing effect)
 * Returns an async generator that yields stream events
 * @param request - Chat request parameters
 * @param accessToken - Optional access token for authenticated requests (enables usage tracking)
 */
export async function* streamChatMessage(
  request: ChatRequest,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent, void, unknown> {
  const API_BASE = getApiBaseUrl();
  const sanitizedRequest = sanitizeChatRequest(request);
  const maxAutoRetries = 1;
  let attempt = 0;

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  const withJitter = (baseMs: number) => {
    const jitter = Math.floor(Math.random() * 250);
    return Math.max(100, baseMs + jitter);
  };

  while (!signal?.aborted) {
    // Build headers with optional auth
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    let emittedAnyContent = false;
    let shouldRetry = false;

    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify(sanitizedRequest),
      credentials: "include",
      signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        try {
          const errorData = await response.json();
          if (errorData.detail?.error === "usage_limit_exceeded") {
            yield {
              type: "error",
              message: `You've reached your monthly limit of ${errorData.detail.limit} AI queries. Upgrade your plan for more queries.`,
              retryable: false,
              reason_code: "usage_limit_exceeded",
            };
            return;
          }
        } catch {
          // If parsing fails, fall through to generic handling.
        }

        if (attempt < maxAutoRetries) {
          attempt += 1;
          await sleep(withJitter(1000));
          continue;
        }

        yield {
          type: "error",
          message: "Rate limit exceeded. Please try again later.",
          retryable: true,
          reason_code: "rate_limited",
        };
        return;
      }
      yield { type: "error", message: `Chat stream error: ${response.status}` };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: "error", message: "No response body" };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE format: "data: content\n\n"
        const lines = buffer.split("\n\n");
        // Keep the last incomplete chunk in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue;
          }
          const content = line.slice(6); // Remove "data: " prefix

          if (content === "[DONE]") {
            yield { type: "done" };
            return;
          }

          if (content.startsWith("[ERROR_JSON]")) {
            try {
              const parsed = JSON.parse(content.slice(12)) as {
                message?: string;
                retryable?: boolean;
                retry_after_ms?: number;
                reason_code?: string;
                provider?: string | null;
                trace_id?: string;
              };

              if (
                parsed.retryable &&
                !emittedAnyContent &&
                attempt < maxAutoRetries &&
                !signal?.aborted
              ) {
                attempt += 1;
                await sleep(withJitter(parsed.retry_after_ms ?? 800));
                shouldRetry = true;
                break;
              }

              yield {
                type: "error",
                message: parsed.message || "Chat stream failed. Please retry.",
                retryable: parsed.retryable,
                retry_after_ms: parsed.retry_after_ms,
                reason_code: parsed.reason_code,
                provider: parsed.provider,
                trace_id: parsed.trace_id,
              };
              return;
            } catch {
              yield { type: "error", message: "Chat stream failed. Please retry." };
              return;
            }
          }

          if (content.startsWith("[ERROR]")) {
            yield { type: "error", message: content.slice(7) };
            return;
          }

          if (content.startsWith("[CITATIONS]")) {
            try {
              const citationsJson = content.slice(11); // Remove "[CITATIONS]" prefix
              const citations = JSON.parse(citationsJson) as ChatSource[];
              yield { type: "citations", citations };
            } catch (e) {
              console.error("Failed to parse citations:", e);
            }
            continue;
          }

          if (content.startsWith("[CONTENT_UPDATE]")) {
            // Backend sends sanitized content to replace the streamed content
            const fullContent = content.slice(16).replace(/\\n/g, "\n"); // Remove "[CONTENT_UPDATE]" prefix
            yield { type: "content_update", fullContent };
            continue;
          }

          if (content.startsWith("[VERIFICATION]")) {
            try {
              const verificationJson = content.slice(14); // Remove "[VERIFICATION]" prefix
              const data = JSON.parse(verificationJson) as StreamVerificationData;
              yield { type: "verification", data };
            } catch (e) {
              console.error("Failed to parse verification data:", e);
            }
            continue;
          }

          if (content === "[GENERATION_DONE]") {
            yield { type: "generation_done" };
            continue;
          }

          if (content.startsWith("[CONVERSATION_ID]")) {
            const id = content.slice(17); // Remove "[CONVERSATION_ID]" prefix
            yield { type: "conversation_id", id };
            continue;
          }

          if (content.startsWith("[MESSAGE_ID]")) {
            const id = content.slice(12); // Remove "[MESSAGE_ID]" prefix
            yield { type: "message_id", id };
            continue;
          }

          if (content.startsWith("[FOLLOWUPS]")) {
            try {
              const followupsJson = content.slice(11); // Remove "[FOLLOWUPS]" prefix
              const questions = JSON.parse(followupsJson) as string[];
              yield { type: "followups", questions };
            } catch (e) {
              console.error("Failed to parse follow-up suggestions:", e);
            }
            continue;
          }

          // Regular content - unescape newlines
          const text = content.replace(/\\n/g, "\n");
          if (text) {
            emittedAnyContent = true;
          }
          yield { type: "content", text };
        }

        if (shouldRetry) {
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (shouldRetry) {
      continue;
    }
    return;
  }
}

/**
 * Convert ChatResponse citations to ChatSource format for display
 */
export function mapCitationsToSources(citations: ChatSource[]): ChatSource[] {
  return citations.map((citation) => ({
    document_id: citation.document_id,
    title: citation.title,
    human_readable_id: citation.human_readable_id,
    document_type: citation.document_type,
    excerpt: citation.excerpt,
    relevance_score: citation.relevance_score,
    section: citation.section,
  }));
}

/**
 * Get suggested questions for the current context
 * Returns hardcoded suggestions since backend doesn't have this endpoint yet
 */
export function getSuggestedQuestions(documentType?: string): string[] {
  const generalQuestions = [
    "What are the key provisions of the Income Tax Act?",
    "How are disputes resolved in Ugandan courts?",
    "What are the requirements for company registration?",
    "Explain the constitutional rights in Uganda",
  ];

  const typeSpecificQuestions: Record<string, string[]> = {
    act: [
      "What is the purpose of this Act?",
      "When did this law come into effect?",
      "What are the penalties defined in this Act?",
    ],
    judgment: [
      "What was the court's ruling in this case?",
      "What precedents does this judgment set?",
      "What were the key arguments presented?",
    ],
    regulation: [
      "What does this regulation govern?",
      "Who must comply with this regulation?",
      "What are the compliance requirements?",
    ],
    constitution: [
      "What rights are protected under this provision?",
      "How can this constitutional right be enforced?",
      "What are the limitations on this right?",
    ],
  };

  if (documentType && typeSpecificQuestions[documentType]) {
    return typeSpecificQuestions[documentType];
  }

  return generalQuestions;
}
