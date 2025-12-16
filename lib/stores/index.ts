/**
 * Stores Barrel Export
 *
 * Re-exports all Zustand stores for convenient imports.
 */

export { useUIStore } from "./ui-store";
export {
  useChatStore,
  useCurrentConversation,
  useConversationMessages,
  useActiveConversations,
  useArchivedConversations,
  useStarredConversations,
  useRecentConversations,
  type Conversation,
} from "./chat-store";
export {
  useLibraryStore,
  useSavedDocuments,
  useReadingHistory,
  useIsDocumentSaved,
  type SavedDocument,
  type ReadingHistoryEntry,
} from "./library-store";
export {
  useResearchSessionsStore,
  useRecentResearchSessions,
  useResearchSessionById,
  useCompletedResearchSessions,
  type ResearchSessionSummary,
} from "./research-store";
