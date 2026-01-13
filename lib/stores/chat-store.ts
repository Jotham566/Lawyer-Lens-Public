/**
 * Chat Store
 *
 * State management for Legal Assistant conversations.
 * Supports user-scoped storage for authenticated users.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  ChatMessage,
  ChatSource,
  VerificationStatus,
  ConfidenceInfo,
} from "@/lib/api/types";
import { getConversations, getConversation, deleteConversation as deleteConversationApi } from "@/lib/api/chat";

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  // New fields for better management
  isArchived?: boolean;
  isStarred?: boolean;
}

interface ChatState {
  // Current conversation
  currentConversationId: string | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;

  // User-scoped storage key
  userId: string | null;
  setUserId: (userId: string | null) => void;

  // Actions
  setCurrentConversation: (id: string | null) => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  deleteConversationAsync: (id: string, accessToken?: string | null) => Promise<void>;
  renameConversation: (id: string, title: string) => void;
  archiveConversation: (id: string) => void;
  unarchiveConversation: (id: string) => void;
  starConversation: (id: string) => void;
  unstarConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateLastMessage: (
    conversationId: string,
    content: string,
    sources?: ChatSource[],
    suggestedFollowups?: string[],
    verification?: VerificationStatus,
    confidenceInfo?: ConfidenceInfo
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

  // API Integration
  fetchConversations: (accessToken?: string | null) => Promise<void>;
  fetchConversation: (id: string, accessToken?: string | null) => Promise<void>;
  replaceConversationId: (oldId: string, newId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const generateTitle = (message: string): string => {
  // Strip markdown formatting, emojis, and tool prefixes for cleaner titles
  const cleaned = message
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove **bold**
    .replace(/\*([^*]+)\*/g, "$1") // Remove *italic*
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "") // Remove emojis
    .replace(/^(Deep Research|Draft Contract):\s*/i, "") // Remove tool prefixes
    .trim();

  // Take first 50 chars as title
  const title = cleaned.slice(0, 50);
  return title.length < cleaned.length ? `${title}...` : title;
};

// Helper to get user-specific storage key
const getStorageKey = (userId: string | null) => {
  return userId ? `law-lens-chat-${userId}` : "law-lens-chat-anonymous";
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentConversationId: null,
      conversations: [],
      isLoading: false,
      error: null,
      userId: null,

      setUserId: (userId) => {
        const currentUserId = get().userId;

        // If switching users, load new user's data FIRST then update state
        // This prevents a race condition where empty data is saved before load
        if (currentUserId !== userId) {
          // Default to empty state for new user
          let newConversations: Conversation[] = [];
          let newCurrentConversationId: string | null = null;

          // Load the new user's data from localStorage BEFORE updating state
          // This prevents the persist middleware from overwriting existing data
          if (typeof window !== "undefined" && userId) {
            const storageKey = getStorageKey(userId);
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed.state) {
                  newConversations = parsed.state.conversations || [];
                  newCurrentConversationId = parsed.state.currentConversationId || null;
                }
              } catch (e) {
                console.error("Failed to load user chat data:", e);
              }
            }
          }

          // Update state in a single call to avoid race conditions
          // The persist middleware will save the correct data, not empty arrays
          set({
            userId,
            conversations: newConversations,
            currentConversationId: newCurrentConversationId,
          });
        } else {
          set({ userId });
        }
      },

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
          isArchived: false,
          isStarred: false,
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
                ? filtered.find((c) => !c.isArchived)?.id || null
                : state.currentConversationId,
          };
        });
      },

      deleteConversationAsync: async (id, accessToken) => {
        try {
          // Call API to delete from backend
          await deleteConversationApi(id, accessToken);

          // On success, update local state
          set((state) => {
            const filtered = state.conversations.filter((c) => c.id !== id);
            return {
              conversations: filtered,
              currentConversationId:
                state.currentConversationId === id
                  ? filtered.find((c) => !c.isArchived)?.id || null
                  : state.currentConversationId,
            };
          });
        } catch (error) {
          console.error("Failed to delete conversation:", error);
          // Still remove from local state even if API fails
          // (conversation may have been local-only / not yet synced)
          set((state) => {
            const filtered = state.conversations.filter((c) => c.id !== id);
            return {
              conversations: filtered,
              currentConversationId:
                state.currentConversationId === id
                  ? filtered.find((c) => !c.isArchived)?.id || null
                  : state.currentConversationId,
            };
          });
        }
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

      archiveConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, isArchived: true, updatedAt: new Date().toISOString() }
              : conv
          ),
          currentConversationId:
            state.currentConversationId === id
              ? state.conversations.find((c) => c.id !== id && !c.isArchived)?.id || null
              : state.currentConversationId,
        }));
      },

      unarchiveConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, isArchived: false, updatedAt: new Date().toISOString() }
              : conv
          ),
        }));
      },

      starConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, isStarred: true, updatedAt: new Date().toISOString() }
              : conv
          ),
        }));
      },

      unstarConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, isStarred: false, updatedAt: new Date().toISOString() }
              : conv
          ),
        }));
      },

      addMessage: (conversationId, message) => {
        set((state) => {
          // Check if conversation exists
          const existingConv = state.conversations.find(c => c.id === conversationId);

          if (!existingConv) {
            // Conversation doesn't exist - create it first
            const now = new Date().toISOString();
            const newConversation: Conversation = {
              id: conversationId,
              title: message.role === "user" ? generateTitle(message.content) : "New Conversation",
              messages: [message],
              createdAt: now,
              updatedAt: now,
              isArchived: false,
              isStarred: false,
            };
            return {
              conversations: [newConversation, ...state.conversations],
            };
          }

          // Conversation exists - update it
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

      updateLastMessage: (
        conversationId,
        content,
        sources,
        suggestedFollowups,
        verification,
        confidenceInfo
      ) => {
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
                verification: verification || messages[lastIndex].verification,
                confidence_info: confidenceInfo || messages[lastIndex].confidence_info,
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

      fetchConversations: async (accessToken?: string | null) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getConversations(50, 0, accessToken);

          set((state) => {
            // Create a map of backend conversations
            const backendMap = new Map(response.conversations.map(c => [c.id, c]));

            // 1. Update existing conversations that match backend
            // 2. Add new conversations from backend
            let mergedConversations = state.conversations.map(localConv => {
              const backendConv = backendMap.get(localConv.id);
              if (backendConv) {
                backendMap.delete(localConv.id); // Mark as handled
                return {
                  ...localConv, // Keep local state (messages)
                  title: backendConv.title || localConv.title,
                  updatedAt: backendConv.updated_at,
                  // Don't overwrite messages if we have them locally and they might be newer/optimistic
                  // But if we have no messages locally and backend does (unlikely for list endpoint), 
                  // we'll fetch them in detail later.
                };
              }
              return localConv; // Keep local-only conversations (optimistic creations)
            });

            // Add remaining backend conversations (that weren't in local state)
            const newBackendConversations = Array.from(backendMap.values()).map(summary => ({
              id: summary.id,
              title: summary.title || "New Conversation",
              messages: [],
              createdAt: summary.created_at,
              updatedAt: summary.updated_at,
              isArchived: false,
              isStarred: false,
            }));

            mergedConversations = [...newBackendConversations, ...mergedConversations];

            // Sort by updatedAt desc
            mergedConversations.sort((a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            return {
              conversations: mergedConversations,
              isLoading: false
            };
          });
        } catch (error) {
          console.error("Failed to fetch conversations:", error);
          set({ isLoading: false, error: "Failed to load history" });
        }
      },

      fetchConversation: async (id: string, accessToken?: string | null) => {
        // Don't set global loading as this might be background or specific
        try {
          const detail = await getConversation(id, accessToken);

          set((state) => {
            const conversations = state.conversations.map(c => {
              if (c.id !== id) return c;

              // Map backend messages to store ChatMessage format
              const messages: ChatMessage[] = detail.messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                sources: msg.citations, // Type compat handled by interface match or we map explicitly if needed
                verification: msg.verification || undefined,
                confidence_info: msg.confidence_info || undefined,
                provider: msg.provider || undefined,
                tokens_used: msg.tokens_used
              }));

              return {
                ...c,
                title: detail.title || c.title,
                updatedAt: detail.updated_at,
                messages: messages
              };
            });

            return { conversations };
          });
        } catch (error) {
          console.error(`Failed to fetch conversation ${id}:`, error);
          // Don't error globally, just log
        }
      },

      replaceConversationId: (oldId: string, newId: string) => {
        set((state) => {
          const conversations = state.conversations.map((c) => {
            if (c.id !== oldId) return c;
            return { ...c, id: newId };
          });

          return {
            conversations,
            currentConversationId:
              state.currentConversationId === oldId
                ? newId
                : state.currentConversationId,
          };
        });
      },
    }),
    {
      name: "law-lens-chat",
      // Use dynamic storage key based on user ID
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          // Try to get the current user's storage
          const state = useChatStore.getState?.();
          const userId = state?.userId;
          const key = userId ? `${name}-${userId}` : `${name}-anonymous`;
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return;
          const state = useChatStore.getState?.();
          const userId = state?.userId;
          const key = userId ? `${name}-${userId}` : `${name}-anonymous`;
          localStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          const state = useChatStore.getState?.();
          const userId = state?.userId;
          const key = userId ? `${name}-${userId}` : `${name}-anonymous`;
          localStorage.removeItem(key);
        },
      },
      partialize: (state) =>
        ({
          conversations: state.conversations.slice(0, 50), // Keep last 50 conversations
          currentConversationId: state.currentConversationId,
          userId: state.userId, // Include userId in persisted state
        }) as ChatState,
    }
  )
);

// Selectors - using useShallow for stable array/object references
export const useCurrentConversation = () => {
  const currentId = useChatStore((s) => s.currentConversationId);
  const conversation = useChatStore(
    useShallow((s) => s.conversations.find((c) => c.id === currentId) || null)
  );
  return conversation;
};

export const useConversationMessages = (conversationId: string | null) => {
  return useChatStore(
    useShallow((s) => {
      if (!conversationId) return [];
      return s.conversations.find((c) => c.id === conversationId)?.messages || [];
    })
  );
};

// Get active (non-archived) conversations
export const useActiveConversations = () => {
  return useChatStore(
    useShallow((s) => s.conversations.filter((c) => !c.isArchived))
  );
};

// Get archived conversations
export const useArchivedConversations = () => {
  return useChatStore(
    useShallow((s) => s.conversations.filter((c) => c.isArchived))
  );
};

// Get starred conversations
export const useStarredConversations = () => {
  return useChatStore(
    useShallow((s) => s.conversations.filter((c) => c.isStarred && !c.isArchived))
  );
};

// Get recent conversations (non-archived, most recent first, limited)
export const useRecentConversations = (limit = 10) => {
  return useChatStore(
    useShallow((s) =>
      s.conversations
        .filter((c) => !c.isArchived)
        .slice(0, limit)
    )
  );
};
