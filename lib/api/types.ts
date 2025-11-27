/**
 * API Types for Lawyer Lens Public Portal
 *
 * These types match the backend API responses.
 */

// Document types
export type DocumentType = "act" | "judgment" | "constitution" | "regulation";

export type DocumentStatus =
  | "ingested"
  | "converting"
  | "conversion_failed"
  | "pending_validation"
  | "in_validation"
  | "validated"
  | "rejected"
  | "published";

// Table structure in hierarchical nodes
export interface HierarchicalTable {
  rows: string[][];
  header_rows?: number[];
  identifier?: string;
  page?: number;
}

// Hierarchical structure for document content
export interface HierarchicalNode {
  type: string;
  identifier?: string;
  title?: string;
  label?: string;
  text?: string[];
  tables?: HierarchicalTable[];
  children?: HierarchicalNode[];
}

// Main document interface
export interface Document {
  id: string;
  human_readable_id: string;
  document_type: DocumentType;
  jurisdiction: string;
  title: string;
  short_title?: string;
  long_title?: string;
  publication_date?: string;
  commencement_date?: string;
  gazette_number?: string;
  act_number?: number;
  act_year?: number;
  chapter?: string;
  case_number?: string;
  court_level?: string;
  status: DocumentStatus;
  version_number: number;
  is_latest_version: boolean;
  hierarchical_structure?: HierarchicalNode;
  ocr_confidence_score?: number;
  validation_score?: number;
  minio_original_path: string;
  minio_outputs_path?: string;
  created_at: string;
  updated_at: string;
  validated_at?: string;
  published_at?: string;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Document list filters
export interface DocumentFilters {
  document_type?: DocumentType | DocumentType[];
  year_from?: number;
  year_to?: number;
  court_level?: string;
  status?: DocumentStatus;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Search types
export interface SearchParams {
  q: string;
  document_type?: DocumentType[];
  year_from?: number;
  year_to?: number;
  court_level?: string[];
  page?: number;
  size?: number;
}

export interface SearchHighlight {
  title?: string[];
  content?: string[];
}

export interface SearchResult {
  id: string;
  human_readable_id: string;
  title: string;
  document_type: DocumentType;
  year?: number;
  court_level?: string;
  chapter?: string;
  case_number?: string;
  highlights: SearchHighlight;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pages: number;
  query: string;
}

// Semantic search types
export interface SemanticSearchParams {
  query: string;
  top_k?: number;
  min_similarity?: number;
  document_type?: DocumentType;
}

export interface SemanticResult {
  document_id: string;
  title: string;
  document_type: DocumentType;
  chunk_text: string;
  similarity: number;
  section_path?: string;
  metadata?: Record<string, unknown>;
}

export interface SemanticSearchResponse {
  query: string;
  results: SemanticResult[];
  total: number;
  search_type: "semantic";
}

// Hybrid search types
export interface HybridSearchParams {
  query: string;
  top_k?: number;
  semantic_weight?: number;
  keyword_weight?: number;
  document_type?: DocumentType;
}

export interface HybridSearchResponse {
  query: string;
  results: SemanticResult[];
  total: number;
  search_type: "hybrid";
}

// Chat types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  suggested_followups?: string[];
  timestamp?: string;
}

export interface ChatSource {
  document_id: string;
  title: string;
  human_readable_id: string;
  document_type: DocumentType;
  excerpt: string;
  relevance_score: number;
  section?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  conversation_history?: Array<{ role: string; content: string }>;
  search_mode?: "keyword" | "semantic" | "hybrid";
  max_context_chunks?: number;
  temperature?: number;
}

export interface ChatResponse {
  message_id: string;
  content: string;
  citations: ChatSource[];
  confidence: number;
  provider: string;
  tokens_used: number;
  processing_time_ms: number;
  timestamp: string;
}

// Statistics types
export interface DocumentTypeCount {
  document_type: DocumentType;
  count: number;
}

export interface RepositoryStats {
  total_documents: number;
  by_type: DocumentTypeCount[];
  by_jurisdiction: Record<string, number>;
  by_year: Record<number, number>;
  recent_documents: Document[];
}

// Facets for search filtering
export interface SearchFacets {
  document_types: FacetItem[];
  years: FacetItem[];
  court_levels: FacetItem[];
}

export interface FacetItem {
  value: string;
  count: number;
}
