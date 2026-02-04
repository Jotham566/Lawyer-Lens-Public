"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter, useParams, notFound } from "next/navigation";
import Link from "next/link";
import {
  Gavel,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Calendar,
  Scale,
  Landmark,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { formatDateOnly } from "@/lib/utils/date-formatter";
import { useDocumentsByType } from "@/lib/hooks";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import type { LucideIcon } from "lucide-react";

// Court configuration
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
    description: "The highest court in Uganda. Final court of appeal.",
    icon: Scale,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  court_of_appeal: {
    id: "court_of_appeal",
    name: "Court of Appeal",
    shortName: "CoA",
    description:
      "Hears appeals from the High Court. Also serves as Constitutional Court.",
    icon: Landmark,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  high_court: {
    id: "high_court",
    name: "High Court",
    shortName: "HC",
    description:
      "Court of unlimited original jurisdiction. Hears appeals from lower courts.",
    icon: Building2,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  magistrate: {
    id: "magistrate",
    name: "Magistrate Courts",
    shortName: "MC",
    description: "Handle criminal and civil matters at the local level.",
    icon: Gavel,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
    borderColor: "border-green-200 dark:border-green-800",
  },
};

const yearRanges = [
  { label: "All Years", value: "all" },
  { label: "2020-Present", value: "2020" },
  { label: "2015-2019", value: "2015" },
  { label: "2010-2014", value: "2010" },
  { label: "Before 2010", value: "before2010" },
];

function CourtJudgmentsContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const courtId = params.court as string;
  const court = courtConfig[courtId];

  if (!court) {
    notFound();
  }

  const { data, isLoading, error } = useDocumentsByType("judgment", page, 20);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    router.push(`/judgments/${courtId}?${newParams.toString()}`);
  };

  // Filter by court level (client-side)
  const filteredItems = data?.items.filter(
    (item) => item.court_level === courtId
  );

  const CourtIcon = court.icon;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Breadcrumbs className="mb-6" />

      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/judgments">
          <ArrowLeft className="h-4 w-4 mr-1" />
          All Courts
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              court.bgColor
            )}
          >
            <CourtIcon className={cn("h-6 w-6", court.color)} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {court.name}
              <Badge variant="secondary">{court.shortName}</Badge>
            </h1>
            <p className="text-sm text-muted-foreground">{court.description}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Filter */}
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select defaultValue="date">
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (newest)</SelectItem>
              <SelectItem value="date_asc">Date (oldest)</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as "list" | "grid")}
          className="hidden sm:flex"
        >
          <ToggleGroupItem value="list" aria-label="List view" className="h-9 w-9">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid view" className="h-9 w-9">
            <Grid3X3 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Results */}
      {isLoading && (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-2"
          )}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i}>
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
            <p className="text-sm text-destructive">
              Failed to load judgments. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {filteredItems && filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CourtIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No judgments found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No judgments from the {court.name} available
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/judgments">View all courts</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {filteredItems && filteredItems.length > 0 && (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-2"
          )}
        >
          {filteredItems.map((judgment) => (
            <Link key={judgment.id} href={`/document/${judgment.id}`}>
              <Card
                className={cn(
                  "h-full transition-colors hover:border-primary/50 hover:bg-muted/30",
                  viewMode === "list" && "hover:shadow-sm"
                )}
              >
                <CardHeader className={cn(viewMode === "grid" ? "pb-2" : "py-3")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3
                        className={cn(
                          "font-medium leading-tight",
                          viewMode === "grid" ? "text-sm line-clamp-2" : ""
                        )}
                      >
                        {judgment.title}
                      </h3>
                      {judgment.case_number && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {judgment.case_number}
                        </p>
                      )}
                    </div>
                    {judgment.publication_date && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {new Date(judgment.publication_date).getFullYear()}
                      </Badge>
                    )}
                  </div>
                  {viewMode === "list" && judgment.publication_date && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>
                        {formatDateOnly(judgment.publication_date)}
                      </span>
                    </div>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParams({ page: (page - 1).toString() })}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Page {page} of {data.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.total_pages}
            onClick={() => updateParams({ page: (page + 1).toString() })}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CourtJudgmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-10 w-64 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <CourtJudgmentsContent />
    </Suspense>
  );
}
