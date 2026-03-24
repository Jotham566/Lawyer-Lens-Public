/**
 * API Module Barrel Export
 *
 * Re-exports all API functions and types for convenient imports.
 */

// Client utilities
export { apiFetch, apiGet, apiPost, getApiBaseUrl, APIError } from "./client";

// Documents API
export {
  getAllDocumentsByType,
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
  getJudgmentYears,
  getAvailableJudges,
  getDocumentAknXml,
  getDocumentSection,
  type AknXmlResponse,
  type JudgeInfo,
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
  submitChatFeedback,
  persistConversationMessage,
  streamChatMessage,
  streamChatWithTypewriter,
  getSuggestedQuestions,
  mapCitationsToSources,
  type StreamEvent,
  type PersistConversationMessageRequest,
  type PersistConversationMessageResponse,
} from "./chat";

// Research API
export {
  createResearchSession,
  getResearchSession,
  submitClarifyingAnswers,
  approveResearchBrief,
  saveResearchBrief,
  resumeResearchSession,
  getResearchReport,
  saveResearchReport,
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
  type ResearchAudit,
  type ResearchExecutionTraceEntry,
  type ResearchGraphCheckpoint,
  type StreamProgress,
  type ResearchTopicRequest,
  type ApproveBriefRequest,
  type SaveResearchBriefRequest,
  type SaveResearchReportRequest,
} from "./research";

// Contracts API
export {
  getContractTemplates,
  getContractTemplate,
  createContractSession,
  getContractSession,
  submitContractRequirements,
  submitContractReview,
  saveContractDraft,
  getContractDownloadUrl,
  streamContractProgress,
  getMyContracts,
  getEnhancedTemplates,
  saveContractAsTemplate,
  type ContractPhase,
  type ContractTemplate,
  type TemplateField,
  type ContractQuestion,
  type ContractSession,
  type ContractRequirements,
  type PartyInfo,
  type ContractDraft,
  type ContractSection,
  type CreateContractRequest,
  type ContractReview,
  type SaveContractDraftRequest,
  type SectionEdit,
  type SaveAsTemplateRequest,
  type ContractListItem,
  type EnhancedTemplate,
} from "./contracts";

// Auth API
export {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  updateProfile,
  getSessions,
  revokeSession,
  revokeAllSessions,
  type User,
  type UserSession,
  type AuthTokens,
  type LoginResponse,
  type RegisterResponse,
  type RegisterRequest,
  type LoginRequest,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
  type ChangePasswordRequest,
  type UpdateProfileRequest,
  type VerifyEmailRequest,
} from "./auth";

// Beta API
export { getPublicBetaMode, type PublicBetaMode } from "./beta";

// Knowledge Base API
export {
  uploadDocument,
  listDocuments,
  getDocument as getKBDocument,
  getDocumentStatus,
  deleteDocument as deleteKBDocument,
  searchKnowledgeBase,
  getKnowledgeBaseStats,
  formatFileSize,
  getStatusColor,
  type OrgDocument,
  type OrgDocumentListResponse,
  type DocumentUploadResponse,
  type DocumentSearchResult,
  type DocumentSearchResponse,
  type KnowledgeBaseStats,
  type ProcessingStatus,
  type DocumentStatus as KBDocumentStatus,
} from "./knowledge-base";

// Integrations API (API Keys)
export {
  getAvailableScopes,
  listAPIKeys,
  createAPIKey,
  revokeAPIKey,
  getAPIKeyUsage,
  type APIKeyScope,
  type APIKey,
  type APIKeyCreateRequest,
  type APIKeyCreateResponse,
  type APIKeyListResponse,
  type AvailableScopesResponse,
  type UsageStats,
} from "./integrations";

// Citations API
export {
  getTopCitedDocuments,
  type CitedDocumentSummary,
} from "./citations";

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
