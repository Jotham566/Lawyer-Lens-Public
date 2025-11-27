/**
 * API Module Barrel Export
 *
 * Re-exports all API functions and types for convenient imports.
 */

// Client utilities
export { apiFetch, apiGet, apiPost, getApiBaseUrl, APIError } from "./client";

// Documents API
export {
  getDocument,
  getDocuments,
  getDocumentContent,
  getDocumentPdfUrl,
  getRecentDocuments,
  getRepositoryStats,
  getDocumentsByType,
  getDocumentTypes,
  getAvailableYears,
  getCourtLevels,
  getDocumentAknXml,
  type AknXmlResponse,
} from "./documents";

// Search API
export {
  searchDocuments,
  semanticSearch,
  hybridSearch,
  getSearchFacets,
  getSearchSuggestions,
} from "./search";

// Chat API
export {
  sendChatMessage,
  getChatHealth,
  streamChatMessage,
  getSuggestedQuestions,
  mapCitationsToSources,
} from "./chat";

// Types
export type {
  // Document types
  DocumentType,
  DocumentStatus,
  Document,
  HierarchicalNode,
  PaginatedResponse,
  DocumentFilters,
  // Search types
  SearchParams,
  SearchHighlight,
  SearchResult,
  SearchResponse,
  SemanticSearchParams,
  SemanticResult,
  SemanticSearchResponse,
  HybridSearchParams,
  HybridSearchResponse,
  SearchFacets,
  FacetItem,
  // Chat types
  ChatMessage,
  ChatSource,
  ChatRequest,
  ChatResponse,
  // Statistics
  RepositoryStats,
  DocumentTypeCount,
} from "./types";
