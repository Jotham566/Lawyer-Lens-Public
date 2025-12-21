/**
 * Chat API
 *
 * Functions for Legal Assistant interactions.
 */

import { apiPost, apiGet, getApiBaseUrl } from "./client";
import type {
  ChatRequest,
  ChatResponse,
  ChatSource,
  VerificationStatus,
  ConfidenceInfo,
  ConversationListResponse,
  ConversationDetail,
} from "./types";

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
  return apiPost<ChatResponse>("/chat", request);
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
  offset: number = 0,
  accessToken?: string | null
): Promise<ConversationListResponse> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return apiGet<ConversationListResponse>(
    `/chat/conversations?limit=${limit}&offset=${offset}`,
    headers
  );
}

/**
 * Get full conversation details
 */
export async function getConversation(
  conversationId: string,
  accessToken?: string | null
): Promise<ConversationDetail> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return apiGet<ConversationDetail>(`/chat/conversations/${conversationId}`, headers);
}


/**
 * Verification data from the stream
 */
export interface StreamVerificationData {
  verification: VerificationStatus;
  confidence_info: ConfidenceInfo;
}

/**
 * Stream event types from the chat API
 */
export type StreamEvent =
  | { type: "content"; text: string }
  | { type: "content_update"; fullContent: string }
  | { type: "citations"; citations: ChatSource[] }
  | { type: "verification"; data: StreamVerificationData }
  | { type: "conversation_id"; id: string }
  | { type: "followups"; questions: string[] }
  | { type: "done" }
  | { type: "error"; message: string };

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
  accessToken?: string | null
): AsyncGenerator<StreamEvent, void, unknown> {
  const { charsPerTick = 10, tickDelay = 10 } = config;

  // Use an object wrapper to avoid TypeScript closure inference issues
  const state = {
    contentBuffer: "",
    revealedLength: 0,
    isStreaming: true,
    citations: null as ChatSource[] | null,
    contentUpdatePending: null as string | null,
    verificationData: null as StreamVerificationData | null,
    conversationId: null as string | null,
    followups: null as string[] | null,
  };

  // Start the stream
  const streamPromise = (async () => {
    for await (const event of streamChatMessage(request, accessToken)) {
      if (event.type === "content") {
        state.contentBuffer += event.text;
      } else if (event.type === "content_update") {
        // Backend sends sanitized content - queue it to replace buffer after reveal
        state.contentUpdatePending = event.fullContent;
      } else if (event.type === "citations") {
        state.citations = event.citations;
      } else if (event.type === "verification") {
        state.verificationData = event.data;
      } else if (event.type === "conversation_id") {
        state.conversationId = event.id;
      } else if (event.type === "followups") {
        state.followups = event.questions;
      } else if (event.type === "done") {
        state.isStreaming = false;
      } else if (event.type === "error") {
        state.isStreaming = false;
        throw new Error(event.message);
      }
    }
    state.isStreaming = false;
  })();

  // Reveal content gradually
  while (state.isStreaming || state.revealedLength < state.contentBuffer.length) {
    if (state.revealedLength < state.contentBuffer.length) {
      const nextLength = Math.min(state.revealedLength + charsPerTick, state.contentBuffer.length);
      const newText = state.contentBuffer.slice(state.revealedLength, nextLength);
      state.revealedLength = nextLength;
      yield { type: "content", text: newText };
    }

    // Small delay for typing effect
    await new Promise(resolve => setTimeout(resolve, tickDelay));
  }

  // Wait for stream to complete
  await streamPromise;

  // If there's a content update (sanitized version), send it to replace the content
  if (state.contentUpdatePending !== null) {
    yield { type: "content_update", fullContent: state.contentUpdatePending };
  }

  // Send citations if we have them
  if (state.citations) {
    yield { type: "citations", citations: state.citations };
  }

  // Send verification data if available (for trust indicators)
  if (state.verificationData) {
    yield { type: "verification", data: state.verificationData };
  }

  // Send conversation ID update if we have one
  if (state.conversationId) {
    yield { type: "conversation_id", id: state.conversationId };
  }

  // Send follow-up suggestions if we have them
  if (state.followups && state.followups.length > 0) {
    yield { type: "followups", questions: state.followups };
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
  accessToken?: string | null
): AsyncGenerator<StreamEvent, void, unknown> {
  const API_BASE = getApiBaseUrl();

  // Build headers with optional auth
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Handle specific error cases
    if (response.status === 429) {
      try {
        const errorData = await response.json();
        if (errorData.detail?.error === "usage_limit_exceeded") {
          throw new Error(
            `You've reached your monthly limit of ${errorData.detail.limit} AI queries. ` +
            `Upgrade your plan for more queries.`
          );
        }
      } catch (e) {
        // If parsing fails, throw generic rate limit error
        if (e instanceof Error && e.message.includes("monthly limit")) {
          throw e;
        }
      }
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Chat stream error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
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
        if (line.startsWith("data: ")) {
          const content = line.slice(6); // Remove "data: " prefix

          if (content === "[DONE]") {
            yield { type: "done" };
            return;
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

          if (content.startsWith("[CONVERSATION_ID]")) {
            const id = content.slice(17); // Remove "[CONVERSATION_ID]" prefix
            yield { type: "conversation_id", id };
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
          yield { type: "content", text };
        }
      }
    }
  } finally {
    reader.releaseLock();
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
