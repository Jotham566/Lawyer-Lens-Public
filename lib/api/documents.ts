/**
 * Documents API
 *
 * Functions for fetching and managing documents from the public endpoints.
 * These endpoints only return validated/published documents.
 */

import { apiGet, getApiBaseUrl } from "./client";
import type {
  Document,
  DocumentFilters,
  PaginatedResponse,
  RepositoryStats,
  DocumentType,
  SectionResponse,
  ExpandedSourceResponse,
} from "./types";

/**
 * Get a single document by ID (public endpoint)
 */
export async function getDocument(id: string): Promise<Document> {
  return apiGet<Document>(`/public/documents/${id}`);
}

/**
 * Get a list of documents with optional filters (public endpoint)
 */
export async function getDocuments(
  filters?: DocumentFilters
): Promise<PaginatedResponse<Document>> {
  const params: Record<string, string | number | boolean | undefined> = {};

  if (filters) {
    if (filters.document_type) {
      params.document_type = Array.isArray(filters.document_type)
        ? filters.document_type[0] // API accepts single type
        : filters.document_type;
    }
    if (filters.year_from) params.year = filters.year_from; // API uses 'year' param
    if (filters.court_level) params.court_level = filters.court_level;
    if (filters.page) params.page = filters.page;
    if (filters.size) params.page_size = filters.size;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_order) params.sort_order = filters.sort_order;
  }

  return apiGet<PaginatedResponse<Document>>("/public/documents", params);
}

/**
 * Get document content in a specific format
 */
export async function getDocumentContent(
  id: string,
  format: "json" | "xml" | "md"
): Promise<string> {
  // For now, get the document and extract hierarchical_structure for JSON
  if (format === "json") {
    const doc = await getDocument(id);
    return JSON.stringify(doc.hierarchical_structure, null, 2);
  }
  // XML and MD formats are placeholders
  return `Format "${format}" coming soon`;
}

/**
 * Get the URL for a document's PDF (public endpoint)
 */
export function getDocumentPdfUrl(id: string): string {
  return `${getApiBaseUrl()}/public/documents/${id}/pdf`;
}

/**
 * Get recent documents (from stats endpoint)
 */
export async function getRecentDocuments(
  limit: number = 10
): Promise<Document[]> {
  const stats = await getRepositoryStats();
  return stats.recent_documents.slice(0, limit);
}

/**
 * Get repository statistics (public endpoint)
 */
export async function getRepositoryStats(): Promise<RepositoryStats> {
  return apiGet<RepositoryStats>("/public/stats");
}

/**
 * Get documents by type with pagination
 */
export async function getDocumentsByType(
  type: DocumentType,
  page: number = 1,
  size: number = 20
): Promise<PaginatedResponse<Document>> {
  return getDocuments({
    document_type: type,
    page,
    size,
    sort_by: "title",
    sort_order: "asc",
  });
}

/**
 * Get available document types with counts
 */
export async function getDocumentTypes(): Promise<
  Array<{ document_type: string; count: number }>
> {
  return apiGet<Array<{ document_type: string; count: number }>>(
    "/public/document-types"
  );
}

/**
 * Get available years with document counts
 */
export async function getAvailableYears(): Promise<Record<number, number>> {
  return apiGet<Record<number, number>>("/public/years");
}

/**
 * Get available court levels (for judgments)
 */
export async function getCourtLevels(): Promise<Record<string, number>> {
  return apiGet<Record<string, number>>("/public/courts");
}

/**
 * AKN XML Response type
 */
export interface AknXmlResponse {
  document_id: string;
  human_readable_id: string;
  xml_content: string;
}

/**
 * Get AKN XML content for a document
 */
export async function getDocumentAknXml(id: string): Promise<AknXmlResponse> {
  return apiGet<AknXmlResponse>(`/public/documents/${id}/akn`);
}

/**
 * Get a specific section from a document by its AKN eId
 *
 * The eId follows AKN naming conventions:
 * - sec_19 - Section 19
 * - sec_19__subsec_2 - Section 19(2)
 * - sec_19__subsec_2__para_a - Section 19(2)(a)
 *
 * @param documentId - The UUID of the document
 * @param eId - The AKN element identifier (e.g., "sec_19__subsec_2")
 */
export async function getDocumentSection(
  documentId: string,
  eId: string
): Promise<SectionResponse> {
  return apiGet<SectionResponse>(`/public/documents/${documentId}/section/${eId}`);
}

/**
 * Get expanded source content for a citation
 *
 * When a citation excerpt contains table data that may be truncated,
 * this fetches the complete content from the document's hierarchical structure.
 *
 * @param documentId - The UUID of the document
 * @param excerpt - The partial excerpt to expand
 * @param section - Optional section reference
 * @param chunkId - Optional chunk ID for precise lookup (most accurate)
 */
export async function expandSource(
  documentId: string,
  excerpt: string,
  section?: string,
  chunkId?: string
): Promise<ExpandedSourceResponse> {
  const params: Record<string, string | undefined> = {
    excerpt,
    section,
    chunk_id: chunkId,
  };
  return apiGet<ExpandedSourceResponse>(
    `/public/documents/${documentId}/expand-source`,
    params
  );
}

export type { SectionResponse, ExpandedSourceResponse };
