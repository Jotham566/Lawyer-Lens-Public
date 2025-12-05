/**
 * Chat API
 *
 * Functions for Legal Assistant interactions.
 */

import { apiPost, apiGet, getApiBaseUrl } from "./client";
import type { ChatRequest, ChatResponse, ChatSource } from "./types";

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
 * Stream event types from the chat API
 */
export type StreamEvent =
  | { type: "content"; text: string }
  | { type: "content_update"; fullContent: string }
  | { type: "citations"; citations: ChatSource[] }
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
 */
export async function* streamChatWithTypewriter(
  request: ChatRequest,
  config: TypewriterConfig = {}
): AsyncGenerator<StreamEvent, void, unknown> {
  const { charsPerTick = 10, tickDelay = 10 } = config;

  let contentBuffer = "";
  let revealedLength = 0;
  let isStreaming = true;
  let citations: ChatSource[] | null = null;
  let contentUpdatePending: string | null = null;

  // Start the stream
  const streamPromise = (async () => {
    for await (const event of streamChatMessage(request)) {
      if (event.type === "content") {
        contentBuffer += event.text;
      } else if (event.type === "content_update") {
        // Backend sends sanitized content - queue it to replace buffer after reveal
        contentUpdatePending = event.fullContent;
      } else if (event.type === "citations") {
        citations = event.citations;
      } else if (event.type === "done") {
        isStreaming = false;
      } else if (event.type === "error") {
        isStreaming = false;
        throw new Error(event.message);
      }
    }
    isStreaming = false;
  })();

  // Reveal content gradually
  while (isStreaming || revealedLength < contentBuffer.length) {
    if (revealedLength < contentBuffer.length) {
      const nextLength = Math.min(revealedLength + charsPerTick, contentBuffer.length);
      const newText = contentBuffer.slice(revealedLength, nextLength);
      revealedLength = nextLength;
      yield { type: "content", text: newText };
    }

    // Small delay for typing effect
    await new Promise(resolve => setTimeout(resolve, tickDelay));
  }

  // Wait for stream to complete
  await streamPromise;

  // If there's a content update (sanitized version), send it to replace the content
  if (contentUpdatePending !== null) {
    yield { type: "content_update", fullContent: contentUpdatePending };
  }

  // Send citations if we have them
  if (citations) {
    yield { type: "citations", citations };
  }

  yield { type: "done" };
}

/**
 * Stream chat response (for real-time typing effect)
 * Returns an async generator that yields stream events
 */
export async function* streamChatMessage(
  request: ChatRequest
): AsyncGenerator<StreamEvent, void, unknown> {
  const API_BASE = getApiBaseUrl();

  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
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
