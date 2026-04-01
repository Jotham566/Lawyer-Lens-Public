/**
 * Knowledge Base API client.
 *
 * Enterprise feature: Allows organizations to upload, manage, and search
 * their own internal documents.
 */

import { apiFetch, apiGet, apiPost, apiUpload } from "./client";
import { getToneStyles, getDocumentStatusTone } from "@/lib/design-system";

// =============================================================================
// Types
// =============================================================================

export type DocumentStatus = "uploaded" | "processing" | "ready" | "failed";

export interface OrgDocument {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  status: DocumentStatus;
  error_message?: string;
  page_count?: number;
  word_count?: number;
  chunk_count: number;
  description?: string;
  tags?: string[];
  uploaded_by_email?: string;
  created_at: string;
  updated_at: string;
  processing_started_at?: string;
  processing_completed_at?: string;
}

export interface OrgDocumentListResponse {
  items: OrgDocument[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface DocumentUploadResponse {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  status: DocumentStatus;
  message: string;
}

export interface DocumentSearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  chunk_text: string;
  score: number;
  section_heading?: string;
  page_number?: number;
}

export interface DocumentSearchResponse {
  query: string;
  results: DocumentSearchResult[];
  total_results: number;
}

export interface KnowledgeBaseStats {
  total_documents: number;
  ready_documents: number;
  processing_documents: number;
  failed_documents: number;
  total_chunks: number;
  total_storage_bytes: number;
  storage_limit_bytes?: number;
  storage_percentage?: number;
}

export interface ProcessingStatus {
  id: string;
  status: DocumentStatus;
  error_message?: string;
  page_count?: number;
  word_count?: number;
  chunk_count: number;
  processing_started_at?: string;
  processing_completed_at?: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Upload a document to the knowledge base.
 */
export async function uploadDocument(
  file: File,
  title: string,
  description?: string,
  tags?: string[],
  category?: string,
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  if (description) {
    formData.append("description", description);
  }
  if (tags && tags.length > 0) {
    formData.append("tags", tags.join(","));
  }
  if (category) {
    formData.append("category", category);
  }

  // Use apiFetch with FormData - don't set Content-Type, let browser set it
  return apiFetch<DocumentUploadResponse>("/knowledge-base/documents", {
    method: "POST",
    body: formData,
    headers: {
      // Remove Content-Type to let browser set multipart boundary
    },
  });
}

/**
 * Upload a document using the apiUpload helper.
 * Alternative approach that uses the built-in upload function.
 */
export async function uploadDocumentSimple(
  file: File
): Promise<DocumentUploadResponse> {
  return apiUpload<DocumentUploadResponse>("/knowledge-base/documents", file);
}

/**
 * List documents in the knowledge base.
 */
export async function listDocuments(
  page: number = 1,
  pageSize: number = 20,
  status?: DocumentStatus
): Promise<OrgDocumentListResponse> {
  return apiGet<OrgDocumentListResponse>("/knowledge-base/documents", {
    page,
    page_size: pageSize,
    status,
  });
}

/**
 * Get a specific document.
 */
export async function getDocument(documentId: string): Promise<OrgDocument> {
  return apiGet<OrgDocument>(`/knowledge-base/documents/${documentId}`);
}

/**
 * Get document processing status.
 */
export async function getDocumentStatus(
  documentId: string
): Promise<ProcessingStatus> {
  return apiGet<ProcessingStatus>(
    `/knowledge-base/documents/${documentId}/status`
  );
}

/**
 * Delete a document from the knowledge base.
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await apiFetch<void>(`/knowledge-base/documents/${documentId}`, {
    method: "DELETE",
  });
}

/**
 * Search documents in the knowledge base.
 */
export async function searchKnowledgeBase(
  query: string,
  limit: number = 10,
  minScore: number = 0.5
): Promise<DocumentSearchResponse> {
  return apiPost<DocumentSearchResponse>("/knowledge-base/search", {
    query,
    limit,
    min_score: minScore,
  });
}

/**
 * Get knowledge base statistics.
 */
export async function getKnowledgeBaseStats(): Promise<KnowledgeBaseStats> {
  return apiGet<KnowledgeBaseStats>("/knowledge-base/stats");
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get status color for document status.
 */
export function getStatusColor(status: DocumentStatus): string {
  return getToneStyles(getDocumentStatusTone(status)).surface;
}

/**
 * Trigger compliance classification for a document.
 */
export async function classifyDocument(
  documentId: string,
): Promise<{ status: string; classification: Record<string, unknown> }> {
  return apiPost<{ status: string; classification: Record<string, unknown> }>(
    `/knowledge-base/documents/${documentId}/classify`,
  );
}

/**
 * Get knowledge base connector status.
 */
export async function getConnectorStatus(): Promise<{
  mode: string;
  connector: Record<string, unknown> | null;
  message?: string;
}> {
  return apiGet<{
    mode: string;
    connector: Record<string, unknown> | null;
    message?: string;
  }>("/knowledge-base/connector/status");
}

// =============================================================================
// Connector Management
// =============================================================================

export interface Connector {
  id: string;
  connector_type: string;
  source_name: string;
  source_url: string;
  status: string;
  config: Record<string, unknown>;
  fetch_interval_minutes: number;
  last_fetch_at: string | null;
  next_fetch_at: string | null;
  error_count: number;
  last_error: string | null;
  created_at: string | null;
}

/**
 * List all connectors for the organization.
 */
export async function listConnectors(): Promise<{ connectors: Connector[]; total: number }> {
  return apiGet("/knowledge-base/connectors");
}

/**
 * Create a new connector.
 */
export async function createConnector(data: {
  connector_type: string;
  source_name: string;
  source_url: string;
  config?: Record<string, unknown>;
  fetch_interval_minutes?: number;
}): Promise<{ id: string; status: string }> {
  return apiPost("/knowledge-base/connectors", data);
}

/**
 * Update an existing connector.
 */
export async function updateConnector(
  id: string,
  data: Partial<{
    source_name: string;
    source_url: string;
    config: Record<string, unknown>;
    status: string;
    fetch_interval_minutes: number;
  }>
): Promise<{ id: string; status: string }> {
  return apiFetch(`/knowledge-base/connectors/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Delete a connector.
 */
export async function deleteConnector(id: string): Promise<{ status: string }> {
  return apiFetch(`/knowledge-base/connectors/${id}`, { method: "DELETE" });
}

/**
 * Test connector connectivity.
 */
export async function testConnector(id: string): Promise<{ healthy: boolean; status_code?: number; error?: string }> {
  return apiPost(`/knowledge-base/connectors/${id}/test`);
}
