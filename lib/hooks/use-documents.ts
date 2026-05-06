"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAllDocumentsByType,
  getDocument,
  getDocuments,
  getPdfStatus,
  getRecentDocuments,
  getRepositoryStats,
  getDocumentsByType,
  getDocumentAknXml,
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
 * Hook to pre-flight check whether a document's PDF is reachable.
 *
 * Used by the document detail page to render a "PDF temporarily
 * unavailable" banner instead of mounting <PdfReader> against a 404
 * (the orphan-PDF case from the 2026-05-04 incident). Cached for 60s
 * so navigating away and back doesn't re-probe the upstream.
 */
export function usePdfStatus(id: string | null) {
  return useQuery({
    queryKey: ["pdf-status", id],
    queryFn: () => getPdfStatus(id!),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    retry: 0,
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

/**
 * Hook to fetch all documents of a type by paging within API limits.
 */
export function useAllDocumentsByType(
  type: DocumentType,
  pageSize: number = 100
) {
  return useQuery({
    queryKey: ["documents", "type", "all", type, pageSize],
    queryFn: () => getAllDocumentsByType(type, pageSize),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch AKN XML content for a document
 */
export function useDocumentAknXml(id: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ["document", "akn", id],
    queryFn: () => getDocumentAknXml(id!),
    enabled: !!id && enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes - AKN content rarely changes
    retry: 1, // Only retry once if it fails
  });
}
