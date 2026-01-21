/**
 * API Types for Law Lens Public Portal
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

// Text fragment with styling information
export interface TextFragment {
  text: string;
  styles: string[]; // e.g., ["bold"], ["italic"], ["bold", "italic"]
}

// Styled text block with fragments
export interface StyledTextBlock {
  text: string; // Plain text version
  fragments: TextFragment[];
}

// Content item in hierarchical node (for Docling-style table storage)
export interface HierarchicalContentItem {
  type: string; // "table", "text", etc.
  kind?: string; // For text content kind
  rows?: string[][]; // For table content
  header_rows?: number[]; // For table content
  text?: string; // For text content
  value?: { text: string }; // Alternative text format
}

// Hierarchical structure for document content
export interface HierarchicalNode {
  type: string;
  identifier?: string;
  title?: string;
  label?: string;
  text?: string[];
  styled_text?: StyledTextBlock[]; // Text with formatting (bold, italic, etc.)
  tables?: HierarchicalTable[];
  content?: HierarchicalContentItem[]; // Docling stores tables in content array
  children?: HierarchicalNode[];
  // AKN enrichment fields (added by backend HierarchyEnricher)
  akn_eid?: string;
  legal_reference?: string;
  hierarchy_path?: HierarchyPathItem[];
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
  full_text?: string[];
}

export interface SearchResult {
  document_id: string;
  human_readable_id: string;
  title: string;
  document_type: DocumentType;
  score: number;
  highlights: SearchHighlight;
  short_title?: string;
  act_year?: number;
  case_number?: string;
  court_level?: string;
  court_name?: string;
  status?: string;
  publication_date?: string;
  judgment_date?: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  took_ms: number;
  hits: SearchResult[];
  facets?: {
    document_types: Record<string, number>;
    years: Record<string, number>;
    courts: Record<string, number>;
    statuses: Record<string, number>;
  };
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
  human_readable_id: string;
  title: string;
  document_type: DocumentType;
  similarity_score: number;
  chunk_text: string;
  chunk_id: string;
  section_heading?: string;
  act_year?: number;
  case_number?: string;
  court_level?: string;
  status?: string;
}

export interface SemanticSearchResponse {
  query: string;
  total: number;
  took_ms: number;
  hits: SemanticResult[];
}

// Hybrid search types
export interface HybridSearchParams {
  query: string;
  top_k?: number;
  semantic_weight?: number;
  keyword_weight?: number;
  document_type?: DocumentType;
}

export interface HybridResult {
  document_id: string;
  human_readable_id: string;
  title: string;
  document_type: DocumentType;
  combined_score: number;
  semantic_score: number;
  keyword_score: number;
  chunk_text?: string;
  section_heading?: string;
  act_year?: number;
  case_number?: string;
  court_level?: string;
  status?: string;
}

export interface HybridSearchResponse {
  query: string;
  total: number;
  took_ms: number;
  semantic_weight: number;
  keyword_weight: number;
  hits: HybridResult[];
}

// Chat types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  suggested_followups?: string[];
  timestamp?: string;
  /** Response verification status (for assistant messages) */
  verification?: VerificationStatus;
  /** Detailed confidence information (for assistant messages) */
  confidence_info?: ConfidenceInfo;
}

export interface ChatSource {
  document_id: string;
  title: string;
  human_readable_id: string;
  document_type: DocumentType;
  excerpt: string;
  relevance_score: number;
  section?: string;  // Human-readable section heading (breadcrumb path)
  section_id?: string;  // Section identifier for fetching from AKN XML
  legal_reference?: string;  // Formatted legal reference like "Part II, Section 9(2)"
  chunk_id?: string;  // Chunk ID for precise expand-source lookup
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  conversation_history?: Array<{ role: string; content: string }>;
  search_mode?: "keyword" | "semantic" | "hybrid";
  max_context_chunks?: number;
  temperature?: number;
}

/**
 * Verification status with positive, trust-building framing.
 * Uses encouraging language to build user confidence.
 */
export interface VerificationStatus {
  /** Verification level: 'verified', 'partially_verified', or 'unverified' */
  level: "verified" | "partially_verified" | "unverified";
  /** How well entities are grounded in sources (0-1) */
  source_grounding: number;
  /** How well claims are supported by sources (0-1) */
  claim_support: number;
  /** Brief, encouraging status message */
  message: string;
  /** Optional notes about verification (max 2) */
  notes: string[];
}

/**
 * Confidence information with positive framing.
 * Uses "high", "good", "moderate" instead of negative terms.
 */
export interface ConfidenceInfo {
  /** Overall confidence score (0-1) */
  score: number;
  /** Confidence level: 'high', 'good', or 'moderate' */
  level: "high" | "good" | "moderate";
  /** Contributing factors with scores */
  factors: Record<string, number>;
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
  /** Response verification status (trust indicator) */
  verification?: VerificationStatus;
  /** Detailed confidence information */
  confidence_info?: ConfidenceInfo;
}

// Statistics types
export interface DocumentTypeCount {
  document_type: DocumentType;
  count: number;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationListResponse {
  conversations: ConversationSummary[];
}

export interface ConversationDetail {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    citations: ChatSource[]; // Backend returns citations, distinct from ChatSource? 
    // Backend uses CitationResponse which matches ChatSource mostly but let's check.
    // Backend CitationResponse: document_id, title...
    // Frontend ChatSource: document_id, title...
    // They are compatible.
    tokens_used: number;
    timestamp: string;
    provider: string | null;
    verification: VerificationStatus | null;
    confidence_info: ConfidenceInfo | null;
  }>;
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

// Hierarchy path item for legal reference
export interface HierarchyPathItem {
  type: string;  // 'part', 'section', 'subsection', etc.
  identifier: string;
  title: string;
}

// Section extraction types for citation preview
export interface SectionResponse {
  document_id: string;
  eid: string;
  section_type: string; // 'section', 'subsection', 'paragraph', etc.
  number: string | null;
  heading: string | null;
  content: string; // Plain text content of the section
  html_content: string | null; // Optional HTML-formatted content
  parent_eid: string | null;
  children_eids: string[];
  hierarchy_path: HierarchyPathItem[]; // Full hierarchy path
  legal_reference: string | null; // Formatted reference like "Part II, Section 9(2)"
}

// Expanded source for complete table data
export interface ExpandedSourceResponse {
  document_id: string;
  title: string;
  human_readable_id: string;
  document_type: DocumentType;
  full_excerpt: string; // Complete text, not truncated
  section: string | null;
  section_id?: string | null;
  tables: ExpandedTable[]; // Complete tables from hierarchical structure
  adjacent_chunks: string[]; // Adjacent content for context
}

export interface ExpandedTable {
  rows: string[][];
  header_rows?: number[];
  identifier?: string;
  section?: string;
  section_id?: string;
}
