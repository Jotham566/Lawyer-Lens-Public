/**
 * Hooks Barrel Export
 */

export { useSearch, type SearchMode } from "./use-search";
export {
  useDocument,
  useDocuments,
  useRecentDocuments,
  useRepositoryStats,
  useDocumentsByType,
  useDocumentAknXml,
} from "./use-documents";
export { useThrottledValue, useThrottledState } from "./use-throttled-value";
export {
  useKeyboardShortcuts,
  useModifierKey,
  getModifierKey,
} from "./use-keyboard-shortcuts";
export { useOnlineStatus, type OnlineStatus } from "./use-online-status";
export {
  useFocusRestore,
  useFocusTrap,
  useFocusRef,
  useSkipToMain,
} from "./use-focus-management";

// React Query hooks
export {
  queryKeys,
  useDocumentQuery,
  useDocumentsQuery,
  useRecentDocumentsQuery,
  useRepositoryStatsQuery,
  useDocumentsByTypeQuery,
  useDocumentAknXmlQuery,
  useSearchQuery,
  usePrefetchDocument,
  useInvalidateDocuments,
} from "./use-queries";
