"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDocument,
  getDocuments,
  getRecentDocuments,
  getRepositoryStats,
  getDocumentsByType,
} from "@/lib/api";
import type { DocumentFilters, DocumentType } from "@/lib/api/types";

/**
 * Hook to fetch a single document by ID
 */
export function useDocument(id: string | null) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch paginated documents with filters
 */
export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ["documents", filters],
    queryFn: () => getDocuments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch recent documents
 */
export function useRecentDocuments(limit: number = 10) {
  return useQuery({
    queryKey: ["documents", "recent", limit],
    queryFn: () => getRecentDocuments(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch repository statistics
 */
export function useRepositoryStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: getRepositoryStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch documents by type
 */
export function useDocumentsByType(
  type: DocumentType,
  page: number = 1,
  size: number = 20
) {
  return useQuery({
    queryKey: ["documents", "type", type, page, size],
    queryFn: () => getDocumentsByType(type, page, size),
    staleTime: 5 * 60 * 1000,
  });
}
