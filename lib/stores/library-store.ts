/**
 * Library Store
 *
 * Global state for user's saved/bookmarked documents using Zustand.
 * Persists to localStorage for cross-session storage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DocumentType } from "@/lib/api/types";

// Saved document metadata (lightweight, stored in localStorage)
export interface SavedDocument {
  id: string;
  humanReadableId: string;
  title: string;
  documentType: DocumentType;
  savedAt: string;
  // Optional metadata for display
  shortTitle?: string;
  actYear?: number;
  caseNumber?: string;
  courtLevel?: string;
  publicationDate?: string;
  notes?: string;
}

// Reading history entry
export interface ReadingHistoryEntry {
  documentId: string;
  humanReadableId: string;
  title: string;
  documentType: DocumentType;
  lastAccessedAt: string;
  accessCount: number;
}

interface LibraryState {
  // Saved documents (bookmarks)
  savedDocuments: SavedDocument[];
  saveDocument: (doc: Omit<SavedDocument, "savedAt">) => void;
  unsaveDocument: (documentId: string) => void;
  isDocumentSaved: (documentId: string) => boolean;
  updateDocumentNotes: (documentId: string, notes: string) => void;

  // Reading history
  readingHistory: ReadingHistoryEntry[];
  addToHistory: (
    doc: Omit<ReadingHistoryEntry, "lastAccessedAt" | "accessCount">
  ) => void;
  clearHistory: () => void;

  // Collections (future enhancement)
  // collections: Collection[];
  // createCollection: (name: string) => void;
  // addToCollection: (collectionId: string, documentId: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      // Saved documents
      savedDocuments: [],

      saveDocument: (doc) => {
        const existing = get().savedDocuments.find((d) => d.id === doc.id);
        if (existing) return; // Already saved

        set((state) => ({
          savedDocuments: [
            {
              ...doc,
              savedAt: new Date().toISOString(),
            },
            ...state.savedDocuments,
          ],
        }));
      },

      unsaveDocument: (documentId) => {
        set((state) => ({
          savedDocuments: state.savedDocuments.filter(
            (doc) => doc.id !== documentId
          ),
        }));
      },

      isDocumentSaved: (documentId) => {
        return get().savedDocuments.some((doc) => doc.id === documentId);
      },

      updateDocumentNotes: (documentId, notes) => {
        set((state) => ({
          savedDocuments: state.savedDocuments.map((doc) =>
            doc.id === documentId ? { ...doc, notes } : doc
          ),
        }));
      },

      // Reading history
      readingHistory: [],

      addToHistory: (doc) => {
        set((state) => {
          const existingIndex = state.readingHistory.findIndex(
            (h) => h.documentId === doc.documentId
          );

          if (existingIndex >= 0) {
            // Update existing entry
            const updated = [...state.readingHistory];
            const existing = updated[existingIndex];
            updated.splice(existingIndex, 1);
            return {
              readingHistory: [
                {
                  ...existing,
                  lastAccessedAt: new Date().toISOString(),
                  accessCount: existing.accessCount + 1,
                },
                ...updated,
              ].slice(0, 50), // Keep last 50 items
            };
          }

          // Add new entry
          return {
            readingHistory: [
              {
                ...doc,
                lastAccessedAt: new Date().toISOString(),
                accessCount: 1,
              },
              ...state.readingHistory,
            ].slice(0, 50),
          };
        });
      },

      clearHistory: () => {
        set({ readingHistory: [] });
      },
    }),
    {
      name: "lawyer-lens-library",
      version: 1,
    }
  )
);

// Convenience hooks
export const useSavedDocuments = () =>
  useLibraryStore((state) => state.savedDocuments);

export const useReadingHistory = () =>
  useLibraryStore((state) => state.readingHistory);

export const useIsDocumentSaved = (documentId: string) =>
  useLibraryStore((state) => state.isDocumentSaved(documentId));
