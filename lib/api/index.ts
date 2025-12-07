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
  getDocumentSection,
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
  streamChatWithTypewriter,
  getSuggestedQuestions,
  mapCitationsToSources,
  type StreamEvent,
} from "./chat";

// Research API
export {
  createResearchSession,
  getResearchSession,
  submitClarifyingAnswers,
  approveResearchBrief,
  getResearchReport,
  streamResearchProgress,
  type ResearchStatus,
  type ResearchPhase,
  type ClarifyingQuestion,
  type ResearchTopic,
  type ResearchBrief,
  type ResearchSession,
  type CreateResearchRequest,
  type ClarifyAnswers,
  type ResearchReport,
  type ResearchSection,
  type ResearchCitation,
  type StreamProgress,
  type ResearchTopicRequest,
  type ApproveBriefRequest,
} from "./research";

// Contracts API
export {
  getContractTemplates,
  getContractTemplate,
  createContractSession,
  getContractSession,
  submitContractRequirements,
  submitContractReview,
  getContractDownloadUrl,
  streamContractProgress,
  type ContractPhase,
  type ContractTemplate,
  type TemplateField,
  type ContractSession,
  type ContractRequirements,
  type PartyInfo,
  type ContractDraft,
  type ContractSection,
  type CreateContractRequest,
  type ContractReview,
  type SectionEdit,
} from "./contracts";

// Types
export type {
  // Document types
  DocumentType,
  DocumentStatus,
  Document,
  HierarchicalNode,
  PaginatedResponse,
  DocumentFilters,
  // Section types
  SectionResponse,
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
