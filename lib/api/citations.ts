/**
 * Citations API
 *
 * Functions for fetching citation network data including
 * top-cited (most authoritative) documents.
 */

import { apiGet } from "./client";

/** Summary of a cited document returned by the top-cited endpoint */
export interface CitedDocumentSummary {
  id: string;
  title: string;
  document_type: string | null;
  human_readable_id: string | null;
}

/**
 * Get the most frequently cited (authoritative) documents.
 *
 * Uses the citation network to rank documents by how many
 * other documents reference them — a strong signal of legal
 * authority and relevance.
 */
export async function getTopCitedDocuments(
  limit: number = 5,
  documentType?: string
): Promise<CitedDocumentSummary[]> {
  const params: Record<string, string | number> = { limit };
  if (documentType) params.document_type = documentType;
  return apiGet<CitedDocumentSummary[]>("/citations/stats/top-cited", params);
}
