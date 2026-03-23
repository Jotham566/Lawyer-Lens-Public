"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Grid3X3,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { useAllDocumentsByType } from "@/lib/hooks";
import { surfaceClasses } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { resolveDocumentYear } from "@/lib/utils/document-year";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DEFAULT_PAGE_SIZE = 20;

const yearBuckets = [
  { label: "All Years", value: "all" },
  { label: "2020-Present", value: "2020s" },
  { label: "2010-2019", value: "2010s" },
  { label: "2000-2009", value: "2000s" },
  { label: "1990-1999", value: "1990s" },
  { label: "Before 1990", value: "archive" },
];

const sortOptions = [
  { label: "Title A-Z", value: "title_asc" },
  { label: "Title Z-A", value: "title_desc" },
  { label: "Newest first", value: "year_desc" },
  { label: "Oldest first", value: "year_asc" },
];

function matchesYearBucket(year: number | null, bucket: string) {
  if (!year) return bucket === "all";
  switch (bucket) {
    case "2020s":
      return year >= 2020;
    case "2010s":
      return year >= 2010 && year <= 2019;
    case "2000s":
      return year >= 2000 && year <= 2009;
    case "1990s":
      return year >= 1990 && year <= 1999;
    case "archive":
      return year < 1990;
    default:
      return true;
  }
}

function parseDisplayYear(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ActsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(Number(searchParams.get("page") || "1"), 1);
  const letter = searchParams.get("letter") || "";
  const year = searchParams.get("year") || "all";
  const sort = searchParams.get("sort") || "title_asc";
  const query = searchParams.get("q") || "";
  const view = searchParams.get("view") === "list" ? "list" : "grid";

  const [searchInput, setSearchInput] = useState(query);

  const { data, isLoading, error } = useAllDocumentsByType("act");

  const currentActsUrl = useMemo(() => {
    const params = searchParams.toString();
    return params ? `/legislation/acts?${params}` : "/legislation/acts";
  }, [searchParams]);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const next = params.toString();
    router.push(next ? `/legislation/acts?${next}` : "/legislation/acts");
  };

  const acts = useMemo(() => {
    const items = [...(data || [])];

      const filtered = items.filter((item) => {
      const displayYear = parseDisplayYear(resolveDocumentYear(item));
      const normalizedTitle = item.title.toUpperCase();
      const normalizedQuery = query.trim().toLowerCase();
      const searchableText = [
        item.title,
        item.short_title,
        item.chapter,
        item.act_number ? `Act No. ${item.act_number}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (letter && !normalizedTitle.startsWith(letter)) {
        return false;
      }

      if (year !== "all" && !matchesYearBucket(displayYear, year)) {
        return false;
      }

      if (normalizedQuery && !searchableText.includes(normalizedQuery)) {
        return false;
      }

      return true;
    });

      filtered.sort((a, b) => {
      const aYear = parseDisplayYear(resolveDocumentYear(a)) || 0;
      const bYear = parseDisplayYear(resolveDocumentYear(b)) || 0;
      const titleCompare = a.title.localeCompare(b.title);

      switch (sort) {
        case "title_desc":
          return b.title.localeCompare(a.title);
        case "year_desc":
          return bYear - aYear || titleCompare;
        case "year_asc":
          return aYear - bYear || titleCompare;
        default:
          return titleCompare;
      }
    });

    return filtered;
  }, [data, letter, year, query, sort]);

  const totalPages = Math.max(Math.ceil(acts.length / DEFAULT_PAGE_SIZE), 1);
  const safePage = Math.min(page, totalPages);
  const paginatedActs = acts.slice(
    (safePage - 1) * DEFAULT_PAGE_SIZE,
    safePage * DEFAULT_PAGE_SIZE
  );

  const activeFilters = [
    letter ? { key: "letter", label: `Starts with ${letter}` } : null,
    year !== "all"
      ? {
          key: "year",
          label: yearBuckets.find((bucket) => bucket.value === year)?.label || year,
        }
      : null,
    query ? { key: "q", label: `Search: ${query}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const resultLabel = `${acts.length} act${acts.length === 1 ? "" : "s"}`;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <Breadcrumbs className="mb-6" />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Acts of Parliament</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Search, filter, and sort Uganda&apos;s primary legislation with cleaner navigation and faster access to the Act you need.
          </p>
        </div>

        <div className="rounded-2xl border border-transparent bg-muted/20 px-4 py-3 text-sm dark:border-glass lg:min-w-[180px]">
          <p className="font-medium">{data?.length ?? "..."} total acts indexed</p>
          <p className="text-muted-foreground">{resultLabel} in current view</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="border-border/70 dark:border-glass">
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Search acts
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        updateParams({
                          q: searchInput.trim() || undefined,
                          page: "1",
                        });
                      }
                    }}
                    placeholder="Title, short title, chapter, act number..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Year range
                </label>
                <Select
                  value={year}
                  onValueChange={(value) => updateParams({ year: value === "all" ? undefined : value, page: "1" })}
                >
                  <SelectTrigger>
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearBuckets.map((bucket) => (
                      <SelectItem key={bucket.value} value={bucket.value}>
                        {bucket.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sort by
                </label>
                <Select
                  value={sort}
                  onValueChange={(value) => updateParams({ sort: value, page: "1" })}
                >
                  <SelectTrigger>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Browse by letter
                </label>
                <Select
                  value={letter || "all"}
                  onValueChange={(value) => updateParams({ letter: value === "all" ? undefined : value, page: "1" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All titles</SelectItem>
                    {alphabet.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  View
                </label>
                <ToggleGroup
                  type="single"
                  value={view}
                  onValueChange={(value) => {
                    if (value) {
                      updateParams({ view: value, page: "1" });
                    }
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="grid" aria-label="Grid view">
                    <Grid3X3 className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() =>
                    updateParams({
                      q: searchInput.trim() || undefined,
                      page: "1",
                    })
                  }
                >
                  Apply search
                </Button>
                {activeFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchInput("");
                      router.push("/legislation/acts");
                    }}
                  >
                    Reset all
                  </Button>
                )}
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Quick jump
                  </p>
                  {letter && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto px-0 py-0 text-xs"
                      onClick={() => updateParams({ letter: undefined, page: "1" })}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={!letter ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 rounded-full px-3"
                    onClick={() => updateParams({ letter: undefined, page: "1" })}
                  >
                    All
                  </Button>
                  {alphabet.map((item) => (
                    <Button
                      key={item}
                      variant={letter === item ? "secondary" : "outline"}
                      size="sm"
                      className="h-8 min-w-8 rounded-full px-2.5"
                      onClick={() => updateParams({ letter: item, page: "1" })}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0">
          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge key={filter.key} variant="secondary" className="gap-1 rounded-full px-3 py-1">
                  {filter.label}
                  <button
                    type="button"
                    className={cn("rounded-full", surfaceClasses.iconButton)}
                    onClick={() => {
                      if (filter.key === "q") {
                        setSearchInput("");
                      }
                      updateParams({ [filter.key]: undefined, page: "1" });
                    }}
                    aria-label={`Remove ${filter.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {acts.length === 0 ? 0 : (safePage - 1) * DEFAULT_PAGE_SIZE + 1}
              {"-"}
              {Math.min(safePage * DEFAULT_PAGE_SIZE, acts.length)} of {acts.length}
            </p>
            <p>{sortOptions.find((option) => option.value === sort)?.label || "Title A-Z"}</p>
          </div>

          {isLoading && (
            <div className={cn(view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3")}>
              {Array.from({ length: 9 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">Failed to load acts. Please try again.</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && acts.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <h3 className="mt-4 text-lg font-medium">No acts match these filters</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Adjust the search, clear a filter, or browse all Acts again.
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchInput("");
                      router.push("/legislation/acts");
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && paginatedActs.length > 0 && (
            <div className={cn(view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3")}>
              {paginatedActs.map((act) => {
                const displayYear = resolveDocumentYear(act);
                const documentHref = `/document/${act.id}?returnTo=${encodeURIComponent(currentActsUrl)}&from=acts`;
                return (
                  <Link key={act.id} href={documentHref} className="group block">
                    <Card className={cn("h-full border-border/70 dark:border-glass", surfaceClasses.pagePanelInteractive)}>
                      <CardHeader className={cn(view === "grid" ? "pb-2" : "py-3")}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
                              <Badge variant="outline" className="rounded-full text-[11px] text-foreground/80">
                                Act
                              </Badge>
                              {act.human_readable_id && (
                                <span className="truncate text-foreground/65">{act.human_readable_id}</span>
                              )}
                            </div>
                            <h3 className={cn("font-medium leading-tight", view === "grid" && "line-clamp-2 text-sm")}>
                              {act.title}
                            </h3>
                            {act.short_title && act.short_title !== act.title && (
                              <p className="text-sm text-muted-foreground">{act.short_title}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="shrink-0 rounded-full">
                            {displayYear || "N/A"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className={cn("space-y-3", view === "grid" ? "pt-0 pb-4" : "pb-3 pt-0")}>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground/75">
                          {act.chapter && <span className={surfaceClasses.chipButton}>Chapter {act.chapter}</span>}
                          {act.act_number && <span className={surfaceClasses.chipButton}>Act No. {act.act_number}</span>}
                          {act.publication_date && <span className={surfaceClasses.chipButton}>Published text</span>}
                        </div>
                        <div className="flex items-center justify-end text-sm">
                          <span className="inline-flex items-center font-medium text-brand-gold ll-transition group-hover:text-brand-gold-soft">
                            Open Act
                            <ArrowRight className="ml-1 h-4 w-4 ll-transition group-hover:translate-x-1" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {!isLoading && !error && totalPages > 1 && (
            <div className="mt-8 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => updateParams({ page: String(safePage - 1) })}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => updateParams({ page: String(safePage + 1) })}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <Skeleton className="mb-6 h-8 w-40" />
          <Skeleton className="mb-6 h-40 w-full" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <ActsContent />
    </Suspense>
  );
}
