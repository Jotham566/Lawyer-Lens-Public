/**
 * Library Store
 *
 * Global state for user's saved/bookmarked documents using Zustand.
 * Persists to localStorage for instant UI and syncs with the backend
 * Collections API for cross-device persistence.
 *
 * Architecture:
 * - Local: Zustand + localStorage → instant UI updates, survives refresh
 * - Backend: Collections API → cross-device sync, permanent storage
 * - On save/unsave: optimistic local update, then background API sync
 * - On login: hydrate local store from backend collections
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DocumentType } from "@/lib/api/types";
import { collectionsApi } from "@/lib/api/collections";
import type { CollectionItem } from "@/lib/api/collections";

const DEFAULT_COLLECTION_NAME = "My Library";

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
  // Backend sync metadata
  _collectionItemId?: string; // ID of the item in the backend collection
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
  userId: string | null;
  setUserId: (userId: string | null) => void;

  // Saved documents (bookmarks)
  savedDocuments: SavedDocument[];
  saveDocument: (doc: Omit<SavedDocument, "savedAt">) => void;
  unsaveDocument: (documentId: string) => void;
  isDocumentSaved: (documentId: string) => boolean;
  updateDocumentNotes: (documentId: string, notes: string) => void;

  // Backend sync
  _defaultCollectionId: string | null;
  _syncInProgress: boolean;
  syncWithBackend: () => Promise<void>;

  // Reading history
  readingHistory: ReadingHistoryEntry[];
  addToHistory: (
    doc: Omit<ReadingHistoryEntry, "lastAccessedAt" | "accessCount">
  ) => void;
  clearHistory: () => void;
}

const getStorageKey = (userId: string | null) =>
  userId ? `law-lens-library-${userId}` : "law-lens-library-anonymous";

/**
 * Background sync: ensure default collection exists and return its ID.
 * Creates "My Library" if it doesn't exist.
 */
async function ensureDefaultCollection(): Promise<string | null> {
  try {
    const collections = await collectionsApi.getAll();
    const defaultCol = collections.find(
      (c) => c.name === DEFAULT_COLLECTION_NAME
    );
    if (defaultCol) return defaultCol.id;

    // Create it
    const newCol = await collectionsApi.create({
      name: DEFAULT_COLLECTION_NAME,
      description: "Your saved documents and bookmarks",
    });
    return newCol.id;
  } catch {
    // Not authenticated or network error — skip sync
    return null;
  }
}

/**
 * Convert backend CollectionItem to local SavedDocument. Returns null
 * for research-report items — those have no document_id and don't
 * belong in the SavedDocument shape (they're handled by a separate
 * /research/history surface). Filtering happens at the call site.
 */
function collectionItemToSaved(item: CollectionItem): SavedDocument | null {
  if (!item.document_id) return null;
  return {
    id: item.document_id,
    humanReadableId: item.meta?.identifier || "",
    title: item.meta?.title || "Untitled",
    documentType: (item.meta?.document_type as DocumentType) || "act",
    savedAt: item.created_at,
    caseNumber: typeof item.meta?.case_number === "string" ? item.meta.case_number : undefined,
    courtLevel: typeof item.meta?.court_level === "string" ? item.meta.court_level : undefined,
    actYear: typeof item.meta?.act_year === "number" ? item.meta.act_year : undefined,
    notes: item.notes || undefined,
    _collectionItemId: item.id,
  };
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      userId: null,
      _defaultCollectionId: null,
      _syncInProgress: false,

      setUserId: (userId) => {
        const currentUserId = get().userId;

        if (currentUserId !== userId) {
          let newSavedDocuments: SavedDocument[] = [];
          let newReadingHistory: ReadingHistoryEntry[] = [];

          if (typeof window !== "undefined" && userId) {
            const stored = localStorage.getItem(getStorageKey(userId));
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed.state) {
                  newSavedDocuments = parsed.state.savedDocuments || [];
                  newReadingHistory = parsed.state.readingHistory || [];
                }
              } catch (error) {
                console.error("Failed to load user library data:", error);
              }
            }
          }

          set({
            userId,
            savedDocuments: newSavedDocuments,
            readingHistory: newReadingHistory,
            _defaultCollectionId: null,
          });

          // Trigger background sync from backend after setting user
          if (userId) {
            void get().syncWithBackend();
          }
          return;
        }

        set({ userId });
      },

      /**
       * Sync local store with backend collections.
       * Merges backend items into local store (backend is source of truth for cross-device).
       */
      syncWithBackend: async () => {
        if (get()._syncInProgress || !get().userId) return;
        set({ _syncInProgress: true });

        try {
          const collectionId = await ensureDefaultCollection();
          if (!collectionId) {
            set({ _syncInProgress: false });
            return;
          }

          set({ _defaultCollectionId: collectionId });

          // Fetch the full collection with items
          const collection = await collectionsApi.get(collectionId);
          const backendItems = collection.items || [];

          // Merge: backend items are authoritative for cross-device sync.
          // Filter to document items only — research-report items live
          // in the same collection_items table now but are surfaced via
          // /research/history, not SavedDocument.
          const localDocs = get().savedDocuments;
          const backendDocIds = new Set(
            backendItems.map((i) => i.document_id).filter((id): id is string => Boolean(id))
          );

          // Convert backend items to SavedDocuments (drops research items via the null filter)
          const backendSaved = backendItems
            .map(collectionItemToSaved)
            .filter((doc): doc is SavedDocument => doc !== null);

          // Merge: keep backend items + local-only items
          const merged: SavedDocument[] = [...backendSaved];
          for (const localDoc of localDocs) {
            if (!backendDocIds.has(localDoc.id)) {
              // Local-only item — push to backend
              merged.push(localDoc);
              // Background: add to backend collection
              void collectionsApi
                .addItem(collectionId, {
                  document_id: localDoc.id,
                  item_type: "document",
                  notes: localDoc.notes,
                  meta: {
                    title: localDoc.title,
                    document_type: localDoc.documentType,
                    identifier: localDoc.humanReadableId,
                    case_number: localDoc.caseNumber,
                    court_level: localDoc.courtLevel,
                    act_year: localDoc.actYear,
                  },
                })
                .catch(() => {}); // Non-blocking
            }
          }

          // Sort by savedAt (newest first)
          merged.sort(
            (a, b) =>
              new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
          );

          set({ savedDocuments: merged, _syncInProgress: false });
        } catch (error) {
          console.warn("Library sync failed:", error);
          set({ _syncInProgress: false });
        }
      },

      // Saved documents
      savedDocuments: [],

      saveDocument: (doc) => {
        const existing = get().savedDocuments.find((d) => d.id === doc.id);
        if (existing) return; // Already saved

        // Optimistic local update
        set((state) => ({
          savedDocuments: [
            {
              ...doc,
              savedAt: new Date().toISOString(),
            },
            ...state.savedDocuments,
          ],
        }));

        // Background: sync to backend
        const collectionId = get()._defaultCollectionId;
        if (collectionId) {
          void collectionsApi
            .addItem(collectionId, {
              document_id: doc.id,
              item_type: "document",
              notes: doc.notes,
              meta: {
                title: doc.title,
                document_type: doc.documentType,
                identifier: doc.humanReadableId,
                case_number: doc.caseNumber,
                court_level: doc.courtLevel,
                act_year: doc.actYear,
              },
            })
            .then((item) => {
              // Update local doc with backend item ID for future removal
              set((state) => ({
                savedDocuments: state.savedDocuments.map((d) =>
                  d.id === doc.id
                    ? { ...d, _collectionItemId: item.id }
                    : d
                ),
              }));
            })
            .catch(() => {
              // Sync failed — local state is still correct, will retry on next sync
            });
        } else {
          // No collection yet — try to create one and sync
          void ensureDefaultCollection().then((newColId) => {
            if (newColId) {
              set({ _defaultCollectionId: newColId });
              void collectionsApi
                .addItem(newColId, {
                  document_id: doc.id,
                  item_type: "document",
                  meta: { title: doc.title, document_type: doc.documentType },
                })
                .catch(() => {});
            }
          });
        }
      },

      unsaveDocument: (documentId) => {
        const doc = get().savedDocuments.find((d) => d.id === documentId);
        const collectionItemId = doc?._collectionItemId;
        const collectionId = get()._defaultCollectionId;

        // Optimistic local update
        set((state) => ({
          savedDocuments: state.savedDocuments.filter(
            (d) => d.id !== documentId
          ),
        }));

        // Background: remove from backend
        if (collectionId && collectionItemId) {
          void collectionsApi
            .removeItem(collectionId, collectionItemId)
            .catch(() => {
              // Sync failed — item removed locally, will be re-synced if needed
            });
        }
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
              ].slice(0, 50),
            };
          }

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
      name: "law-lens-library",
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const state = useLibraryStore.getState?.();
          const key = state?.userId ? getStorageKey(state.userId) : name;
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return;
          const state = useLibraryStore.getState?.();
          const key = state?.userId ? getStorageKey(state.userId) : name;
          localStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          const state = useLibraryStore.getState?.();
          const key = state?.userId ? getStorageKey(state.userId) : name;
          localStorage.removeItem(key);
        },
      },
      version: 2, // Bump version to force re-hydration with new fields
      partialize: (state) =>
        ({
          userId: state.userId,
          savedDocuments: state.savedDocuments,
          readingHistory: state.readingHistory,
          _defaultCollectionId: state._defaultCollectionId,
        }) as unknown as LibraryState,
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
