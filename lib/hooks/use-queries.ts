/**
 * React Query Hooks
 *
 * Centralized query hooks with automatic caching, deduplication, and retry logic.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDocument,
  getDocuments,
  getRecentDocuments,
  getRepositoryStats,
  getDocumentsByType,
  getDocumentAknXml,
} from "@/lib/api/documents";
import { searchDocuments } from "@/lib/api/search";
import type { DocumentType } from "@/lib/api/types";

// Query key factory for consistent key management
export const queryKeys = {
  documents: {
    all: ["documents"] as const,
    lists: () => [...queryKeys.documents.all, "list"] as const,
    list: (filters: { type?: string; page?: number; limit?: number }) =>
      [...queryKeys.documents.lists(), filters] as const,
    details: () => [...queryKeys.documents.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
    byType: (type: DocumentType, page?: number, limit?: number) =>
      [...queryKeys.documents.all, "byType", type, { page, limit }] as const,
    recent: (limit?: number) =>
      [...queryKeys.documents.all, "recent", { limit }] as const,
    aknXml: (id: string) =>
      [...queryKeys.documents.all, "akn", id] as const,
  },
  stats: {
    all: ["stats"] as const,
    repository: () => [...queryKeys.stats.all, "repository"] as const,
  },
  search: {
    all: ["search"] as const,
    results: (query: string, filters: Record<string, unknown>) =>
      [...queryKeys.search.all, query, filters] as const,
  },
} as const;

/**
 * Hook for fetching a single document
 */
export function useDocumentQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.documents.detail(id),
    queryFn: () => getDocument(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 10 * 60 * 1000, // Documents don't change often, cache for 10 mins
  });
}

/**
 * Hook for fetching documents list
 */
export function useDocumentsQuery(
  filters?: {
    page?: number;
    size?: number;
    document_type?: DocumentType | DocumentType[];
    year_from?: number;
  },
  options?: { enabled?: boolean }
) {
  const page = filters?.page ?? 1;
  const size = filters?.size ?? 20;

  return useQuery({
    queryKey: queryKeys.documents.list({ page, limit: size, type: filters?.document_type?.toString() }),
    queryFn: () => getDocuments(filters),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook for fetching recent documents
 */
export function useRecentDocumentsQuery(
  limit: number = 10,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.documents.recent(limit),
    queryFn: () => getRecentDocuments(limit),
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000, // Recent docs may change more often
  });
}

/**
 * Hook for fetching repository stats
 */
export function useRepositoryStatsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.stats.repository(),
    queryFn: getRepositoryStats,
    enabled: options?.enabled ?? true,
    staleTime: 15 * 60 * 1000, // Stats don't change frequently
  });
}

/**
 * Hook for fetching documents by type
 */
export function useDocumentsByTypeQuery(
  type: DocumentType,
  page: number = 1,
  limit: number = 20,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.documents.byType(type, page, limit),
    queryFn: () => getDocumentsByType(type, page, limit),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook for fetching document AKN XML
 */
export function useDocumentAknXmlQuery(
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.documents.aknXml(id),
    queryFn: () => getDocumentAknXml(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 30 * 60 * 1000, // AKN XML is static, cache longer
  });
}

/**
 * Hook for searching documents
 */
export function useSearchQuery(
  query: string,
  filters: {
    documentTypes?: DocumentType[];
    yearFrom?: number;
    yearTo?: number;
    page?: number;
    size?: number;
  } = {},
  options?: { enabled?: boolean }
) {
  const { page = 1, size = 20, documentTypes, yearFrom, yearTo } = filters;

  return useQuery({
    queryKey: queryKeys.search.results(query, { ...filters, page, size }),
    queryFn: () =>
      searchDocuments({
        q: query,
        document_type: documentTypes,
        year_from: yearFrom,
        year_to: yearTo,
        page,
        size,
      }),
    enabled: (options?.enabled ?? true) && !!query,
    staleTime: 60 * 1000, // Search results fresh for 1 minute
  });
}

/**
 * Hook for prefetching a document
 */
export function usePrefetchDocument() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.documents.detail(id),
      queryFn: () => getDocument(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook for invalidating document queries
 */
export function useInvalidateDocuments() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all }),
    invalidateOne: (id: string) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.detail(id),
      }),
    invalidateSearch: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.search.all }),
  };
}
