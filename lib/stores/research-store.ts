/**
 * Research Sessions Store
 *
 * State management for tracking user's research sessions.
 * Sessions are stored locally and synced with backend when available.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMemo } from "react";
import type { ResearchStatus } from "@/lib/api/research";

export interface ResearchSessionSummary {
  id: string;
  query: string;
  title: string;
  status: ResearchStatus;
  createdAt: string;
  updatedAt: string;
  reportReady: boolean;
}

interface ResearchSessionsState {
  // Sessions list (most recent first)
  sessions: ResearchSessionSummary[];
  userId: string | null;

  // Actions
  setUserId: (userId: string | null) => void;
  addSession: (session: Omit<ResearchSessionSummary, "updatedAt">) => void;
  updateSession: (id: string, updates: Partial<ResearchSessionSummary>) => void;
  removeSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  getSession: (id: string) => ResearchSessionSummary | undefined;
  clearSessions: () => void;
}

const generateTitle = (query: string): string => {
  const cleaned = query.trim();
  const title = cleaned.slice(0, 60);
  return title.length < cleaned.length ? `${title}...` : title;
};

const getStorageKey = (userId: string | null) =>
  userId ? `law-lens-research-sessions-${userId}` : "law-lens-research-sessions-anonymous";

export const useResearchSessionsStore = create<ResearchSessionsState>()(
  persist(
    (set, get) => ({
      sessions: [],
      userId: null,

      setUserId: (userId) => {
        const currentUserId = get().userId;

        if (currentUserId !== userId) {
          let newSessions: ResearchSessionSummary[] = [];

          if (typeof window !== "undefined" && userId) {
            const stored = localStorage.getItem(getStorageKey(userId));
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed.state) {
                  newSessions = parsed.state.sessions || [];
                }
              } catch (error) {
                console.error("Failed to load user research session data:", error);
              }
            }
          }

          set({
            userId,
            sessions: newSessions,
          });
          return;
        }

        set({ userId });
      },

      addSession: (session) => {
        const now = new Date().toISOString();
        const newSession: ResearchSessionSummary = {
          ...session,
          title: session.title || generateTitle(session.query),
          updatedAt: now,
        };

        set((state) => {
          // Check if session already exists
          const existingIndex = state.sessions.findIndex(
            (s) => s.id === session.id
          );
          if (existingIndex !== -1) {
            // Update existing session
            const updated = [...state.sessions];
            updated[existingIndex] = { ...updated[existingIndex], ...newSession };
            return { sessions: updated };
          }
          // Add new session at the beginning
          return { sessions: [newSession, ...state.sessions] };
        });
      },

      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id
              ? { ...session, ...updates, updatedAt: new Date().toISOString() }
              : session
          ),
        }));
      },

      removeSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
        }));
      },

      renameSession: (id, title) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id
              ? { ...session, title, updatedAt: new Date().toISOString() }
              : session
          ),
        }));
      },

      getSession: (id) => {
        return get().sessions.find((session) => session.id === id);
      },

      clearSessions: () => set({ sessions: [] }),
    }),
    {
      name: "law-lens-research-sessions",
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const state = useResearchSessionsStore.getState?.();
          const key = state?.userId ? getStorageKey(state.userId) : name;
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return;
          const state = useResearchSessionsStore.getState?.();
          const key = state?.userId ? getStorageKey(state.userId) : name;
          localStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          const state = useResearchSessionsStore.getState?.();
          const key = state?.userId ? getStorageKey(state.userId) : name;
          localStorage.removeItem(key);
        },
      },
      partialize: (state) =>
        ({
          sessions: state.sessions.slice(0, 100), // Keep last 100 sessions
          userId: state.userId,
        }) as ResearchSessionsState,
    }
  )
);

// Selectors
export const useRecentResearchSessions = (limit = 5) => {
  const sessions = useResearchSessionsStore((state) => state.sessions);
  return useMemo(() => sessions.slice(0, limit), [sessions, limit]);
};

export const useResearchSessionById = (id: string) => {
  return useResearchSessionsStore((state) =>
    state.sessions.find((s) => s.id === id)
  );
};

export const useCompletedResearchSessions = () => {
  const sessions = useResearchSessionsStore((state) => state.sessions);
  return useMemo(
    () => sessions.filter((s) => s.status === "complete"),
    [sessions]
  );
};
