"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  FileText,
  Gavel,
  ScrollText,
  Scale,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSearch, type SearchMode } from "@/lib/hooks";
import type { DocumentType, SearchResult, SemanticResult } from "@/lib/api/types";

const documentTypeConfig: Record<
  DocumentType,
  { label: string; icon: typeof FileText; className: string }
> = {
  act: { label: "Act", icon: FileText, className: "badge-act" },
  judgment: { label: "Judgment", icon: Gavel, className: "badge-judgment" },
  regulation: {
    label: "Regulation",
    icon: ScrollText,
    className: "badge-regulation",
  },
  constitution: {
    label: "Constitution",
    icon: Scale,
    className: "badge-constitution",
  },
};

const searchModes: { value: SearchMode; label: string; description: string }[] = [
  { value: "keyword", label: "Keyword", description: "Exact word matching" },
  { value: "semantic", label: "Semantic", description: "AI-powered meaning" },
  { value: "hybrid", label: "Hybrid", description: "Best of both" },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { query, mode, page, filters, data, isLoading, error } = useSearch();

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newQuery = formData.get("q") as string;
    if (newQuery.trim()) {
      updateSearchParams({ q: newQuery.trim(), page: "1" });
    }
  };

  const handleModeChange = (newMode: SearchMode) => {
    updateSearchParams({ mode: newMode, page: "1" });
  };

  const handleTypeFilter = (type: DocumentType | "all") => {
    updateSearchParams({
      type: type === "all" ? undefined : type,
      page: "1",
    });
  };

  const clearFilters = () => {
    updateSearchParams({
      type: undefined,
      year_from: undefined,
      year_to: undefined,
      court: undefined,
      page: "1",
    });
  };

  const hasFilters =
    filters.documentTypes?.length ||
    filters.yearFrom ||
    filters.yearTo ||
    filters.courtLevels?.length;

  // Get results based on mode
  const results = data
    ? "results" in data
      ? (data.results as (SearchResult | SemanticResult)[])
      : []
    : [];

  const total = data ? ("total" in data ? data.total : 0) : 0;
  const totalPages = data
    ? "pages" in data
      ? data.pages
      : Math.ceil(total / 20)
    : 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search laws, cases, regulations..."
            className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
          >
            Search
          </Button>
        </form>

        {/* Search Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {searchModes.map((searchMode) => (
            <Button
              key={searchMode.value}
              variant={mode === searchMode.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange(searchMode.value)}
              className="gap-1"
            >
              {searchMode.label}
              <span className="hidden text-xs opacity-70 sm:inline">
                ({searchMode.description})
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Filters & Results */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Filters Sidebar */}
        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Filters
            </h2>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            )}
          </div>

          <Separator />

          {/* Document Type Filter */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Document Type</h3>
            <div className="space-y-1">
              <Button
                variant={!filters.documentTypes?.length ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => handleTypeFilter("all")}
              >
                All Types
              </Button>
              {(Object.entries(documentTypeConfig) as [DocumentType, typeof documentTypeConfig.act][]).map(
                ([type, config]) => (
                  <Button
                    key={type}
                    variant={
                      filters.documentTypes?.includes(type)
                        ? "secondary"
                        : "ghost"
                    }
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => handleTypeFilter(type)}
                  >
                    <config.icon className="h-4 w-4" />
                    {config.label}
                  </Button>
                )
              )}
            </div>
          </div>

          <Separator />

          {/* Year Filter */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Year Range</h3>
            <div className="flex gap-2">
              <Select
                value={filters.yearFrom?.toString() || ""}
                onValueChange={(value) =>
                  updateSearchParams({
                    year_from: value || undefined,
                    page: "1",
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => 2024 - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.yearTo?.toString() || ""}
                onValueChange={(value) =>
                  updateSearchParams({
                    year_to: value || undefined,
                    page: "1",
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => 2024 - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="space-y-4">
          {/* Results Header */}
          {query && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {isLoading
                  ? "Searching..."
                  : `${total.toLocaleString()} results for "${query}"`}
              </span>
              {hasFilters && (
                <div className="flex flex-wrap gap-1">
                  {filters.documentTypes?.map((type) => (
                    <Badge key={type} variant="secondary" className="gap-1">
                      {documentTypeConfig[type]?.label || type}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleTypeFilter("all")}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">
                  An error occurred while searching. Please try again.
                </p>
              </CardContent>
            </Card>
          )}

          {/* No Query State */}
          {!query && !isLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                  Enter a search query
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search for laws, judgments, regulations, and more
                </p>
              </CardContent>
            </Card>
          )}

          {/* No Results State */}
          {query && !isLoading && results.length === 0 && !error && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No results found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try different keywords or adjust your filters
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result) => (
                <SearchResultCard
                  key={"id" in result ? result.id : result.document_id}
                  result={result}
                  mode={mode}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  updateSearchParams({ page: (page - 1).toString() })
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  updateSearchParams({ page: (page + 1).toString() })
                }
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult | SemanticResult;
  mode: SearchMode;
}

function SearchResultCard({ result, mode }: SearchResultCardProps) {
  // Handle both SearchResult and SemanticResult types
  const id = "id" in result ? result.id : result.document_id;
  const title = result.title;
  const documentType = result.document_type;
  const config = documentTypeConfig[documentType];

  // Get highlight or snippet content
  const content =
    "highlights" in result
      ? result.highlights.content?.[0] || result.highlights.title?.[0]
      : "chunk_text" in result
      ? result.chunk_text
      : null;

  // Get relevance indicator
  const score = "score" in result ? result.score : result.similarity;

  return (
    <Link href={`/document/${id}`}>
      <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-tight">{title}</h3>
            <Badge className={cn("shrink-0", config?.className)}>
              {config?.label || documentType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {content && (
            <p
              className="line-clamp-2 text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: content.replace(
                  /<em>/g,
                  '<mark class="bg-yellow-200 dark:bg-yellow-800/50">'
                ).replace(/<\/em>/g, "</mark>"),
              }}
            />
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {"year" in result && result.year && <span>{result.year}</span>}
            {"chapter" in result && result.chapter && (
              <span>Chapter {result.chapter}</span>
            )}
            {"case_number" in result && result.case_number && (
              <span>{result.case_number}</span>
            )}
            {mode !== "keyword" && (
              <span className="ml-auto">
                {(score * 100).toFixed(0)}% match
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-11 max-w-2xl" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
