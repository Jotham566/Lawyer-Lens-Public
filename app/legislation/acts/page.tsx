"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Calendar,
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
import { useDocumentsByType } from "@/lib/hooks";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const yearRanges = [
  { label: "All Years", value: "all" },
  { label: "2020-Present", value: "2020" },
  { label: "2010-2019", value: "2010" },
  { label: "2000-2009", value: "2000" },
  { label: "1990-1999", value: "1990" },
  { label: "Before 1990", value: "before1990" },
];

function ActsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const letter = searchParams.get("letter");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const { data, isLoading, error } = useDocumentsByType("act", page, 20);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/legislation/acts?${params.toString()}`);
  };

  const filteredItems = letter
    ? data?.items.filter((item) => item.title.toUpperCase().startsWith(letter))
    : data?.items;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Breadcrumbs className="mb-6" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Acts of Parliament
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse {data?.total || "..."} enacted statutes
            </p>
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
          <Select defaultValue="title">
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="title_desc">Title Z-A</SelectItem>
              <SelectItem value="year">Year (newest)</SelectItem>
              <SelectItem value="year_asc">Year (oldest)</SelectItem>
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

      {/* Alphabet Index */}
      <div className="mb-6 flex flex-wrap gap-1 border-b pb-4">
        <Button
          variant={!letter ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-3"
          onClick={() => updateParams({ letter: undefined, page: "1" })}
        >
          All
        </Button>
        {alphabet.map((l) => (
          <Button
            key={l}
            variant={letter === l ? "secondary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateParams({ letter: l, page: "1" })}
          >
            {l}
          </Button>
        ))}
      </div>

      {/* Results */}
      {isLoading && (
        <div className={cn(
          viewMode === "grid"
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-2"
        )}>
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
              Failed to load acts. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {filteredItems && filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No acts found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {letter
                ? `No acts starting with "${letter}"`
                : "No acts available"}
            </p>
            {letter && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => updateParams({ letter: undefined, page: "1" })}
              >
                Clear filter
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {filteredItems && filteredItems.length > 0 && (
        <div className={cn(
          viewMode === "grid"
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-2"
        )}>
          {filteredItems.map((act) => (
            <Link key={act.id} href={`/document/${act.id}`}>
              <Card className={cn(
                "h-full transition-colors hover:border-primary/50 hover:bg-muted/30",
                viewMode === "list" && "hover:shadow-sm"
              )}>
                <CardHeader className={cn(
                  viewMode === "grid" ? "pb-2" : "py-3"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className={cn(
                        "font-medium leading-tight",
                        viewMode === "grid" ? "text-sm line-clamp-2" : ""
                      )}>
                        {act.title}
                      </h3>
                      {act.short_title && viewMode === "list" && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {act.short_title}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {act.act_year || "N/A"}
                    </Badge>
                  </div>
                  {viewMode === "list" && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {act.chapter && <span>Chapter {act.chapter}</span>}
                      {act.act_number && <span>Act No. {act.act_number}</span>}
                    </div>
                  )}
                </CardHeader>
                {viewMode === "grid" && (act.chapter || act.act_number) && (
                  <CardContent className="pt-0 pb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {act.chapter && <span>Ch. {act.chapter}</span>}
                      {act.act_number && <span>No. {act.act_number}</span>}
                    </div>
                  </CardContent>
                )}
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

export default function ActsPage() {
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
      <ActsContent />
    </Suspense>
  );
}
