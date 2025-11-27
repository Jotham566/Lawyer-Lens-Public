"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
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
import { useDocumentsByType } from "@/lib/hooks";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function ActsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const letter = searchParams.get("letter");

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
    router.push(`/browse/acts?${params.toString()}`);
  };

  // Filter by letter (client-side for simplicity)
  const filteredItems = letter
    ? data?.items.filter((item) =>
        item.title.toUpperCase().startsWith(letter)
      )
    : data?.items;

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link href="/browse" className="hover:text-foreground">
              Browse
            </Link>
            <span>/</span>
            <span className="text-foreground">Acts</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Acts</h1>
              <p className="text-sm text-muted-foreground">
                Browse enacted legislation and statutes
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Alphabet Index */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={!letter ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
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

          {/* Sort */}
          <div className="ml-auto">
            <Select defaultValue="title">
              <SelectTrigger className="h-8 w-[140px]">
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
        </div>

        {/* Results */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
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
            </CardContent>
          </Card>
        )}

        {filteredItems && filteredItems.length > 0 && (
          <div className="space-y-2">
            {filteredItems.map((act) => (
              <Link key={act.id} href={`/document/${act.id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium leading-tight">
                          {act.title}
                        </h3>
                        {act.short_title && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {act.short_title}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {act.act_year || "N/A"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {act.chapter && <span>Chapter {act.chapter}</span>}
                      {act.act_number && <span>Act No. {act.act_number}</span>}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: (page - 1).toString() })}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {data.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.total_pages}
              onClick={() => updateParams({ page: (page + 1).toString() })}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ActsContent />
    </Suspense>
  );
}
