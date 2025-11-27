"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { searchDocuments, semanticSearch, hybridSearch } from "@/lib/api";
import type {
  SearchResponse,
  SemanticSearchResponse,
  HybridSearchResponse,
  DocumentType,
} from "@/lib/api/types";

export type SearchMode = "keyword" | "semantic" | "hybrid";

interface UseSearchOptions {
  enabled?: boolean;
}

export function useSearch(options: UseSearchOptions = {}) {
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";
  const mode = (searchParams.get("mode") as SearchMode) || "keyword";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const documentTypes = searchParams.get("type")?.split(",") as
    | DocumentType[]
    | undefined;
  const yearFrom = searchParams.get("year_from")
    ? parseInt(searchParams.get("year_from")!, 10)
    : undefined;
  const yearTo = searchParams.get("year_to")
    ? parseInt(searchParams.get("year_to")!, 10)
    : undefined;
  const courtLevels = searchParams.get("court")?.split(",");

  // Keyword search
  const keywordQuery = useQuery({
    queryKey: [
      "search",
      "keyword",
      query,
      page,
      documentTypes,
      yearFrom,
      yearTo,
      courtLevels,
    ],
    queryFn: () =>
      searchDocuments({
        q: query,
        page,
        size: 20,
        document_type: documentTypes,
        year_from: yearFrom,
        year_to: yearTo,
        court_level: courtLevels,
      }),
    enabled: !!query && mode === "keyword" && options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Semantic search
  const semanticQuery = useQuery({
    queryKey: ["search", "semantic", query, documentTypes],
    queryFn: () =>
      semanticSearch({
        query,
        top_k: 20,
        document_type: documentTypes?.[0],
      }),
    enabled: !!query && mode === "semantic" && options.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });

  // Hybrid search
  const hybridQuery = useQuery({
    queryKey: ["search", "hybrid", query, documentTypes],
    queryFn: () =>
      hybridSearch({
        query,
        top_k: 20,
        document_type: documentTypes?.[0],
      }),
    enabled: !!query && mode === "hybrid" && options.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });

  // Determine which result to return based on mode
  const getResult = ():
    | SearchResponse
    | SemanticSearchResponse
    | HybridSearchResponse
    | undefined => {
    switch (mode) {
      case "keyword":
        return keywordQuery.data;
      case "semantic":
        return semanticQuery.data;
      case "hybrid":
        return hybridQuery.data;
      default:
        return keywordQuery.data;
    }
  };

  const isLoading =
    (mode === "keyword" && keywordQuery.isLoading) ||
    (mode === "semantic" && semanticQuery.isLoading) ||
    (mode === "hybrid" && hybridQuery.isLoading);

  const error =
    (mode === "keyword" && keywordQuery.error) ||
    (mode === "semantic" && semanticQuery.error) ||
    (mode === "hybrid" && hybridQuery.error);

  return {
    query,
    mode,
    page,
    filters: {
      documentTypes,
      yearFrom,
      yearTo,
      courtLevels,
    },
    data: getResult(),
    isLoading,
    error,
    // Individual query states for debugging
    keywordQuery,
    semanticQuery,
    hybridQuery,
  };
}
