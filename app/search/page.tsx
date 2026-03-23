"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageErrorBoundary } from "@/components/error-boundary";
import {
  Search,
  Filter,
  FileText,
  Gavel,
  ScrollText,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
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
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { sanitizeSearchHighlight } from "@/lib/utils/sanitize";
import { useSearch, type SearchMode } from "@/lib/hooks";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { SearchSuggestions, saveRecentSearch } from "@/components/search";
import type { DocumentType, SearchResult, SemanticResult, HybridResult } from "@/lib/api/types";
import { useAuth, useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";

const documentTypeConfig: Record<
  DocumentType,
  { label: string; pluralLabel: string; icon: typeof FileText; className: string; color: string; bgColor: string }
> = {
  act: {
    label: "Act",
    pluralLabel: "Acts of Parliament",
    icon: FileText,
    className: "badge-act",
    color: "text-primary",
    bgColor: "bg-card",
  },
  judgment: {
    label: "Judgment",
    pluralLabel: "Court Judgments",
    icon: Gavel,
    className: "badge-judgment",
    color: "text-primary",
    bgColor: "bg-card",
  },
  regulation: {
    label: "Regulation",
    pluralLabel: "Regulations",
    icon: ScrollText,
    className: "badge-regulation",
    color: "text-primary",
    bgColor: "bg-card",
  },
  constitution: {
    label: "Constitution",
    pluralLabel: "Constitutional Documents",
    icon: BookOpen,
    className: "badge-constitution",
    color: "text-primary",
    bgColor: "bg-card",
  },
};


function SearchContent() {
  const { isLoading: authLoading } = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { query, mode, page, filters, data, isLoading, error } = useSearch({
    enabled: isAuthenticated,
  });
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with URL query
  useEffect(() => {
    setInputValue(query);
  }, [query]);

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
      saveRecentSearch(newQuery.trim());
      updateSearchParams({ q: newQuery.trim(), page: "1" });
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInputValue(suggestion);
    saveRecentSearch(suggestion);
    updateSearchParams({ q: suggestion, page: "1" });
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoading message="Redirecting to login..." />;
  }

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
    ? "hits" in data
      ? (data.hits as (SearchResult | SemanticResult | HybridResult)[])
      : []
    : [];

  const total = data ? ("total" in data ? data.total : 0) : 0;
  const totalPages = data
    ? "total_pages" in data
      ? data.total_pages
      : Math.ceil(total / 20)
    : 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Breadcrumbs className="mb-6" />

      {/* Search Header */}
      <div className={`mb-6 ${surfaceClasses.pageHero}`}>
        <div className="mb-5 flex items-start gap-4">
          <div className={surfaceClasses.pageIconTile}>
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className={surfaceClasses.pageEyebrow}>
              Search
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Search Legal Documents
            </h1>
            <p className="mt-3 text-base leading-8 text-muted-foreground">
              Find acts, judgments, regulations, and constitutional provisions
            </p>
          </div>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="relative max-w-2xl"
          role="search"
          aria-label="Search legal documents"
        >
          <label htmlFor="search-input" className="sr-only">
            Search legal documents
          </label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            name="q"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g., 'land registration requirements' or 'Civil Appeal No. 123'"
            aria-label="Search query"
            aria-haspopup="listbox"
            aria-autocomplete="list"
            autoComplete="off"
            className={`h-14 w-full rounded-2xl pl-10 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${surfaceClasses.searchField}`}
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 disabled:border disabled:border-border/40"
            aria-label="Submit search"
          >
            Search
          </Button>
          <SearchSuggestions
            query={inputValue}
            onSelect={handleSuggestionSelect}
            inputRef={inputRef}
          />
        </form>

        {/* Search Type Indicator with Smart Search Option */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <div className={`flex items-center gap-2 px-3 py-1.5 text-muted-foreground ${surfaceClasses.chipMuted}`}>
            <Search className="h-4 w-4" />
            <span>Keyword Search</span>
            <span className="text-xs">(finds exact terms)</span>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={query ? `/chat?q=${encodeURIComponent(query)}` : "/chat"}>
              <Sparkles className="h-3.5 w-3.5" />
              Get Answers with Citations
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters & Results */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Filters Sidebar */}
        <aside
          className="space-y-4 rounded-[28px] border border-border/60 bg-surface-container p-4 shadow-[var(--shadow-soft)]"
          role="region"
          aria-label="Search filters"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filters
            </h2>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto px-0 py-0 text-xs"
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
        <div className="space-y-4" role="region" aria-label="Search results">
          {/* Results Header */}
          {query && (
            <div
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-surface-container px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-soft)]"
              aria-live="polite"
            >
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
                      <button
                        type="button"
                        onClick={() => handleTypeFilter("all")}
                        className={cn("rounded-full", surfaceClasses.iconButton)}
                        aria-label={`Remove ${documentTypeConfig[type]?.label || type} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
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
                <Card key={i} className="border-border/60 bg-surface-container shadow-[var(--shadow-soft)]">
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
            <Card className="border-destructive/30 bg-destructive/5 shadow-[var(--shadow-soft)]" role="alert" aria-live="assertive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">
                  An error occurred while searching. Please try again.
                </p>
              </CardContent>
            </Card>
          )}

          {/* No Query State */}
          {!query && !isLoading && (
            <Card className="border-border/60 bg-surface-container shadow-[var(--shadow-soft)]">
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
            <Card className="border-border/60 bg-surface-container shadow-[var(--shadow-soft)]">
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
              {results.map((result, index) => (
                <SearchResultCard
                  key={`${result.document_id}-${index}`}
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
  result: SearchResult | SemanticResult | HybridResult;
  mode: SearchMode;
}

function SearchResultCard({ result, mode }: SearchResultCardProps) {
  const searchParams = useSearchParams();
  const documentType = result.document_type;
  const config = documentTypeConfig[documentType];
  const returnTo = `/search?${searchParams.toString()}`;

  // Get highlight or snippet content based on result type
  const content =
    "highlights" in result
      ? result.highlights?.full_text?.[0] || result.highlights?.content?.[0] || result.highlights?.title?.[0]
      : "chunk_text" in result
      ? result.chunk_text
      : null;

  // Get relevance score based on result type
  const getScore = (): number => {
    if ("score" in result) return result.score;
    if ("similarity_score" in result) return result.similarity_score;
    if ("combined_score" in result) return result.combined_score;
    return 0;
  };

  const score = getScore();

  return (
    <Link href={`/document/${result.document_id}?from=search&returnTo=${encodeURIComponent(returnTo)}`}>
      <Card className="border-border/60 bg-surface-container shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-primary/35">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-tight">{result.title}</h3>
            <Badge className={cn("shrink-0", config?.className)}>
              {config?.label || documentType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {content && (
            <p
              className="line-clamp-2 text-sm text-muted-foreground [&_mark]:rounded-[0.35rem] [&_mark]:bg-primary/16 [&_mark]:px-1 [&_mark]:text-foreground dark:[&_mark]:bg-primary/28 dark:[&_mark]:text-primary-foreground"
              dangerouslySetInnerHTML={{
                __html: sanitizeSearchHighlight(content),
              }}
            />
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {"act_year" in result && result.act_year && (
              <span>{result.act_year}</span>
            )}
            {"case_number" in result && result.case_number && (
              <span>{result.case_number}</span>
            )}
            {"court_level" in result && result.court_level && (
              <span>{result.court_level}</span>
            )}
            {score > 0 && (
              <span className="ml-auto">
                {mode === "keyword"
                  ? `Score: ${score.toFixed(1)}`
                  : `${(score * 100).toFixed(0)}% match`}
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
    <PageErrorBoundary fallback="search">
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
    </PageErrorBoundary>
  );
}
