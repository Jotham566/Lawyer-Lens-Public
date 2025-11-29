/**
 * Search API
 *
 * Functions for full-text, semantic, and hybrid search.
 */

import { apiGet, apiPost } from "./client";
import type {
  SearchParams,
  SearchResponse,
  SemanticSearchParams,
  SemanticSearchResponse,
  HybridSearchParams,
  HybridSearchResponse,
  SearchFacets,
} from "./types";

/**
 * Full-text search with Elasticsearch
 */
export async function searchDocuments(
  params: SearchParams
): Promise<SearchResponse> {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    q: params.q,
    page: params.page,
    size: params.size,
  };

  if (params.document_type?.length) {
    queryParams.document_type = params.document_type.join(",");
  }
  if (params.year_from) queryParams.year_from = params.year_from;
  if (params.year_to) queryParams.year_to = params.year_to;
  if (params.court_level?.length) {
    queryParams.court_level = params.court_level.join(",");
  }

  return apiGet<SearchResponse>("/search", queryParams);
}

/**
 * Semantic search with vector embeddings
 * Note: Backend uses POST with query params (not body)
 */
export async function semanticSearch(
  params: SemanticSearchParams
): Promise<SemanticSearchResponse> {
  const queryParams: Record<string, string | number | undefined> = {
    q: params.query,
    top_k: params.top_k,
    min_similarity: params.min_similarity,
    document_type: params.document_type,
  };

  // Build query string
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const url = `/search/semantic?${searchParams.toString()}`;
  return apiPost<SemanticSearchResponse>(url);
}

/**
 * Hybrid search combining keyword and semantic
 * Note: Backend uses POST with query params (not body)
 */
export async function hybridSearch(
  params: HybridSearchParams
): Promise<HybridSearchResponse> {
  const queryParams: Record<string, string | number | undefined> = {
    q: params.query,
    top_k: params.top_k,
    semantic_weight: params.semantic_weight,
    keyword_weight: params.keyword_weight,
    document_type: params.document_type,
  };

  // Build query string
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const url = `/search/hybrid?${searchParams.toString()}`;
  return apiPost<HybridSearchResponse>(url);
}

/**
 * Get search facets for filtering
 */
export async function getSearchFacets(): Promise<SearchFacets> {
  return apiGet<SearchFacets>("/search/facets");
}

/**
 * Get search suggestions/autocomplete
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
): Promise<string[]> {
  return apiGet<string[]>("/search/suggestions", { q: query, limit });
}
