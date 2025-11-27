/**
 * Chat Store
 *
 * State management for AI Legal Assistant conversations.
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
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateLastMessage: (
    conversationId: string,
    content: string,
    sources?: ChatSource[],
    suggestedFollowups?: string[]
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearConversations: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const generateTitle = (message: string): string => {
  // Take first 50 chars of the first message as title
  const title = message.slice(0, 50);
  return title.length < message.length ? `${title}...` : title;
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

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearConversations: () =>
        set({
          conversations: [],
          currentConversationId: null,
        }),
    }),
    {
      name: "lawyer-lens-chat",
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
