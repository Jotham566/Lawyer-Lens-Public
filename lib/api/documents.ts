/**
 * Documents API
 *
 * Functions for fetching and managing documents.
 */

import { apiGet, getApiBaseUrl } from "./client";
import type {
  Document,
  DocumentFilters,
  PaginatedResponse,
  RepositoryStats,
} from "./types";

/**
 * Get a single document by ID
 */
export async function getDocument(id: string): Promise<Document> {
  return apiGet<Document>(`/documents/${id}`);
}

/**
 * Get a list of documents with optional filters
 */
export async function getDocuments(
  filters?: DocumentFilters
): Promise<PaginatedResponse<Document>> {
  const params: Record<string, string | number | boolean | undefined> = {};

  if (filters) {
    if (filters.document_type) {
      params.document_type = Array.isArray(filters.document_type)
        ? filters.document_type.join(",")
        : filters.document_type;
    }
    if (filters.year_from) params.year_from = filters.year_from;
    if (filters.year_to) params.year_to = filters.year_to;
    if (filters.court_level) params.court_level = filters.court_level;
    if (filters.status) params.status = filters.status;
    if (filters.page) params.page = filters.page;
    if (filters.size) params.size = filters.size;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_order) params.sort_order = filters.sort_order;
  }

  return apiGet<PaginatedResponse<Document>>("/documents", params);
}

/**
 * Get document content in a specific format
 */
export async function getDocumentContent(
  id: string,
  format: "json" | "xml" | "md"
): Promise<string> {
  return apiGet<string>(`/documents/${id}/content`, { format });
}

/**
 * Get the URL for a document's PDF
 */
export function getDocumentPdfUrl(id: string): string {
  return `${getApiBaseUrl()}/documents/${id}/pdf`;
}

/**
 * Get recent documents (latest validated)
 */
export async function getRecentDocuments(
  limit: number = 10
): Promise<Document[]> {
  const response = await getDocuments({
    status: "validated",
    page: 1,
    size: limit,
    sort_by: "validated_at",
    sort_order: "desc",
  });
  return response.items;
}

/**
 * Get repository statistics
 */
export async function getRepositoryStats(): Promise<RepositoryStats> {
  return apiGet<RepositoryStats>("/stats");
}

/**
 * Get documents by type with pagination
 */
export async function getDocumentsByType(
  type: "act" | "judgment" | "regulation" | "constitution",
  page: number = 1,
  size: number = 20
): Promise<PaginatedResponse<Document>> {
  return getDocuments({
    document_type: type,
    status: "validated",
    page,
    size,
    sort_by: "title",
    sort_order: "asc",
  });
}
