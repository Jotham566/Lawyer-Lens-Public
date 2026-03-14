"use client";

import { Suspense, useMemo, useState } from "react";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Gavel,
  Grid3X3,
  Landmark,
  List,
  Scale,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
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
import { useAllDocumentsByType } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { formatDateOnly } from "@/lib/utils/date-formatter";
import type { LucideIcon } from "lucide-react";

const DEFAULT_PAGE_SIZE = 18;

const courtConfig: Record<
  string,
  {
    id: string;
    name: string;
    shortName: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  supreme: {
    id: "supreme",
    name: "Supreme Court",
    shortName: "SC",
    description: "Uganda's final court of appeal and the most authoritative source of precedent.",
    icon: Scale,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  court_of_appeal: {
    id: "court_of_appeal",
    name: "Court of Appeal",
    shortName: "CoA",
    description: "Appeals from the High Court and constitutional decisions in one reading stream.",
    icon: Landmark,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  high_court: {
    id: "high_court",
    name: "High Court",
    shortName: "HC",
    description: "Original-jurisdiction and appellate decisions with the widest topical range.",
    icon: Building2,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  magistrate: {
    id: "magistrate",
    name: "Magistrate Courts",
    shortName: "MC",
    description: "Local criminal and civil decisions for practical lower-court research.",
    icon: Gavel,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
    borderColor: "border-green-200 dark:border-green-800",
  },
};

const yearRanges = [
  { label: "All Years", value: "all" },
  { label: "2020-Present", value: "2020s" },
  { label: "2015-2019", value: "2015s" },
  { label: "2010-2014", value: "2010s" },
  { label: "Before 2010", value: "archive" },
];

const sortOptions = [
  { label: "Newest first", value: "date_desc" },
  { label: "Oldest first", value: "date_asc" },
  { label: "Title A-Z", value: "title_asc" },
  { label: "Title Z-A", value: "title_desc" },
];

function matchesYearRange(year: number | null, range: string) {
  if (!year) return range === "all";
  switch (range) {
    case "2020s":
      return year >= 2020;
    case "2015s":
      return year >= 2015 && year <= 2019;
    case "2010s":
      return year >= 2010 && year <= 2014;
    case "archive":
      return year < 2010;
    default:
      return true;
  }
}

function getJudgmentYear(date?: string | null) {
  if (!date) return null;
  const year = new Date(date).getFullYear();
  return Number.isFinite(year) ? year : null;
}

function CourtJudgmentsContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courtId = params.court as string;
  const court = courtConfig[courtId];

  if (!court) {
    notFound();
  }

  const page = Math.max(Number(searchParams.get("page") || "1"), 1);
  const query = searchParams.get("q") || "";
  const year = searchParams.get("year") || "all";
  const sort = searchParams.get("sort") || "date_desc";
  const view = searchParams.get("view") === "list" ? "list" : "grid";

  const [searchInput, setSearchInput] = useState(query);
  const { data, isLoading, error } = useAllDocumentsByType("judgment");
  const CourtIcon = court.icon;

  const currentRoute = useMemo(() => {
    const paramsString = searchParams.toString();
    return paramsString ? `/judgments/${courtId}?${paramsString}` : `/judgments/${courtId}`;
  }, [searchParams, courtId]);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    const next = nextParams.toString();
    router.push(next ? `/judgments/${courtId}?${next}` : `/judgments/${courtId}`);
  };

  const judgments = useMemo(() => {
    const items = (data || []).filter((item) => item.court_level === courtId);
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = items.filter((item) => {
      const judgmentYear = getJudgmentYear(item.publication_date);
      const searchable = [
        item.title,
        item.case_number,
        item.human_readable_id,
        item.court_level,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (year !== "all" && !matchesYearRange(judgmentYear, year)) {
        return false;
      }

      if (normalizedQuery && !searchable.includes(normalizedQuery)) {
        return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const aDate = a.publication_date ? new Date(a.publication_date).getTime() : 0;
      const bDate = b.publication_date ? new Date(b.publication_date).getTime() : 0;
      const titleCompare = a.title.localeCompare(b.title);

      switch (sort) {
        case "date_asc":
          return aDate - bDate || titleCompare;
        case "title_asc":
          return titleCompare;
        case "title_desc":
          return b.title.localeCompare(a.title);
        default:
          return bDate - aDate || titleCompare;
      }
    });

    return filtered;
  }, [data, courtId, query, year, sort]);

  const totalPages = Math.max(Math.ceil(judgments.length / DEFAULT_PAGE_SIZE), 1);
  const safePage = Math.min(page, totalPages);
  const paginatedJudgments = judgments.slice(
    (safePage - 1) * DEFAULT_PAGE_SIZE,
    safePage * DEFAULT_PAGE_SIZE
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <Breadcrumbs className="mb-6" />

      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/judgments">
          <ArrowLeft className="mr-1 h-4 w-4" />
          All Courts
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div
            className={cn(
              "mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl",
              court.bgColor
            )}
          >
            <CourtIcon className={cn("h-5 w-5", court.color)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{court.name}</h1>
            <Badge variant="secondary">{court.shortName}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{court.description}</p>
        </div>

        <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm lg:min-w-[190px]">
          <p className="font-medium">{judgments.length} judgment{judgments.length === 1 ? "" : "s"} in view</p>
          <p className="text-muted-foreground">
            Page {safePage} of {totalPages}
          </p>
        </div>
      </div>

      <Card className="mb-6 border-border/70">
        <CardContent className="pt-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,0.8fr))_auto]">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Search judgments
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      updateParams({ q: searchInput.trim() || undefined, page: "1" });
                    }
                  }}
                  placeholder="Case title, number, citation..."
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
                  {yearRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
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
                View
              </label>
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(value) => value && updateParams({ view: value, page: "1" })}
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
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => updateParams({ q: searchInput.trim() || undefined, page: "1" })}
            >
              Apply search
            </Button>
            {(query || year !== "all" || sort !== "date_desc" || view !== "list") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  router.push(`/judgments/${courtId}`);
                }}
              >
                Reset all
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {judgments.length === 0 ? 0 : (safePage - 1) * DEFAULT_PAGE_SIZE + 1}
          {"-"}
          {Math.min(safePage * DEFAULT_PAGE_SIZE, judgments.length)} of {judgments.length}
        </p>
        <p>{sortOptions.find((option) => option.value === sort)?.label || "Newest first"}</p>
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
            <p className="text-sm text-destructive">Failed to load judgments. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && judgments.length === 0 && (
        <Card>
          <CardContent className="py-14 text-center">
            <CourtIcon className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">No judgments match this view</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a broader year range, clear the search, or move back to all courts.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/judgments">Back to all courts</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && paginatedJudgments.length > 0 && (
        <div className={cn(view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3")}>
          {paginatedJudgments.map((judgment) => {
            const detailHref = `/document/${judgment.id}?returnTo=${encodeURIComponent(currentRoute)}&from=judgments`;
            const judgmentYear = getJudgmentYear(judgment.publication_date);

            return (
              <Link key={judgment.id} href={detailHref} className="group block">
                <Card className="h-full border-border/70 transition-all hover:border-primary/50 hover:bg-muted/20 hover:shadow-sm">
                  <CardHeader className={cn(view === "grid" ? "pb-2" : "py-3")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
                          <Badge variant="outline" className="rounded-full text-[11px] text-foreground/80">
                            {court.shortName}
                          </Badge>
                          {judgment.case_number && (
                            <span className="truncate text-foreground/65">{judgment.case_number}</span>
                          )}
                        </div>
                        <h3 className={cn("font-medium leading-tight transition-colors group-hover:text-primary", view === "grid" && "line-clamp-2 text-sm")}>
                          {judgment.title}
                        </h3>
                      </div>
                      <Badge variant="secondary" className="shrink-0 rounded-full">
                        {judgmentYear || "N/A"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className={cn("space-y-3", view === "grid" ? "pt-0 pb-4" : "pb-3 pt-0")}>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground/75">
                      {judgment.publication_date && (
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          {formatDateOnly(judgment.publication_date)}
                        </span>
                      )}
                      <span className="rounded-full bg-muted px-2.5 py-1">
                        PDF judgment
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        Open judgment, metadata, and reading tools
                      </span>
                      <span className="inline-flex items-center font-medium text-primary">
                        Open case
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
              <ArrowLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => updateParams({ page: String(safePage + 1) })}
            >
              Next
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourtJudgmentsPage() {
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
      <CourtJudgmentsContent />
    </Suspense>
  );
}
