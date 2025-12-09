/**
 * Chat Store
 *
 * State management for Legal Assistant conversations.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatSource } from "@/lib/api/types";

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  // Current conversation
  currentConversationId: string | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentConversation: (id: string | null) => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateLastMessage: (
    conversationId: string,
    content: string,
    sources?: ChatSource[],
    suggestedFollowups?: string[]
  ) => void;
  editMessageAndTruncate: (
    conversationId: string,
    messageIndex: number,
    newContent: string
  ) => void;
  removeMessagesFrom: (conversationId: string, fromIndex: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearConversations: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const generateTitle = (message: string): string => {
  // Strip markdown formatting, emojis, and tool prefixes for cleaner titles
  let cleaned = message
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove **bold**
    .replace(/\*([^*]+)\*/g, "$1") // Remove *italic*
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "") // Remove emojis
    .replace(/^(Deep Research|Draft Contract):\s*/i, "") // Remove tool prefixes
    .trim();

  // Take first 50 chars as title
  const title = cleaned.slice(0, 50);
  return title.length < cleaned.length ? `${title}...` : title;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      currentConversationId: null,
      conversations: [],
      isLoading: false,
      error: null,

      setCurrentConversation: (id) => set({ currentConversationId: id }),

      createConversation: () => {
        const id = generateId();
        const now = new Date().toISOString();
        const newConversation: Conversation = {
          id,
          title: "New Conversation",
          messages: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }));

        return id;
      },

      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          return {
            conversations: filtered,
            currentConversationId:
              state.currentConversationId === id
                ? filtered[0]?.id || null
                : state.currentConversationId,
          };
        });
      },

      renameConversation: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, title, updatedAt: new Date().toISOString() }
              : conv
          ),
        }));
      },

      addMessage: (conversationId, message) => {
        set((state) => {
          const conversations = state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv;

            const updatedMessages = [...conv.messages, message];
            const title =
              conv.messages.length === 0 && message.role === "user"
                ? generateTitle(message.content)
                : conv.title;

            return {
              ...conv,
              title,
              messages: updatedMessages,
              updatedAt: new Date().toISOString(),
            };
          });

          return { conversations };
        });
      },

      updateLastMessage: (conversationId, content, sources, suggestedFollowups) => {
        set((state) => {
          const conversations = state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv;

            const messages = [...conv.messages];
            const lastIndex = messages.length - 1;

            if (lastIndex >= 0 && messages[lastIndex].role === "assistant") {
              messages[lastIndex] = {
                ...messages[lastIndex],
                content,
                sources: sources || messages[lastIndex].sources,
                suggested_followups:
                  suggestedFollowups || messages[lastIndex].suggested_followups,
              };
            }

            return {
              ...conv,
              messages,
              updatedAt: new Date().toISOString(),
            };
          });

          return { conversations };
        });
      },

      editMessageAndTruncate: (conversationId, messageIndex, newContent) => {
        set((state) => {
          const conversations = state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv;

            // Keep messages up to and including the edited message, truncate the rest
            const messages = conv.messages.slice(0, messageIndex);
            messages.push({
              ...conv.messages[messageIndex],
              content: newContent,
              timestamp: new Date().toISOString(),
            });

            // Update title if editing the first user message
            const title =
              messageIndex === 0
                ? generateTitle(newContent)
                : conv.title;

            return {
              ...conv,
              title,
              messages,
              updatedAt: new Date().toISOString(),
            };
          });

          return { conversations };
        });
      },

      removeMessagesFrom: (conversationId, fromIndex) => {
        set((state) => {
          const conversations = state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv;

            return {
              ...conv,
              messages: conv.messages.slice(0, fromIndex),
              updatedAt: new Date().toISOString(),
            };
          });

          return { conversations };
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearConversations: () =>
        set({
          conversations: [],
          currentConversationId: null,
        }),
    }),
    {
      name: "law-lens-chat",
      partialize: (state) => ({
        conversations: state.conversations.slice(0, 50), // Keep last 50 conversations
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);

// Selectors
export const useCurrentConversation = () => {
  const conversations = useChatStore((s) => s.conversations);
  const currentId = useChatStore((s) => s.currentConversationId);
  return conversations.find((c) => c.id === currentId) || null;
};

export const useConversationMessages = (conversationId: string | null) => {
  const conversations = useChatStore((s) => s.conversations);
  if (!conversationId) return [];
  return conversations.find((c) => c.id === conversationId)?.messages || [];
};
