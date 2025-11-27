/**
 * Chat API
 *
 * Functions for AI Legal Assistant interactions.
 */

import { apiPost, apiGet } from "./client";
import type { ChatRequest, ChatResponse, ChatMessage } from "./types";

/**
 * Send a message to the AI Legal Assistant
 */
export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  return apiPost<ChatResponse>("/chat", request);
}

/**
 * Get chat history for a conversation
 */
export async function getChatHistory(
  conversationId: string
): Promise<ChatMessage[]> {
  return apiGet<ChatMessage[]>(`/chat/history/${conversationId}`);
}

/**
 * Create a new conversation
 */
export async function createConversation(): Promise<{ conversation_id: string }> {
  return apiPost<{ conversation_id: string }>("/chat/conversations");
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  return apiPost<void>(`/chat/conversations/${conversationId}/delete`);
}

/**
 * Stream chat response (for real-time typing effect)
 * Returns an async generator that yields response chunks
 */
export async function* streamChatMessage(
  request: ChatRequest
): AsyncGenerator<string, void, unknown> {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

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

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Get suggested questions for the current context
 */
export async function getSuggestedQuestions(
  documentType?: string
): Promise<string[]> {
  const params = documentType ? { document_type: documentType } : undefined;
  return apiGet<string[]>("/chat/suggestions", params);
}
