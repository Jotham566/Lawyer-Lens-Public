"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Gavel, ChevronLeft, ChevronRight } from "lucide-react";
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
import { formatDateOnly } from "@/lib/utils/date-formatter";

const courtLevels = [
  { value: "all", label: "All Courts" },
  { value: "supreme", label: "Supreme Court" },
  { value: "court_of_appeal", label: "Court of Appeal" },
  { value: "high_court", label: "High Court" },
  { value: "magistrate", label: "Magistrate Court" },
];

function JudgmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const court = searchParams.get("court");

  const { data, isLoading, error } = useDocumentsByType("judgment", page, 20);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/browse/judgments?${params.toString()}`);
  };

  // Filter by court level (client-side for simplicity)
  const filteredItems = court
    ? data?.items.filter((item) => item.court_level === court)
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
            <span className="text-foreground">Judgments</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Gavel className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Judgments
              </h1>
              <p className="text-sm text-muted-foreground">
                Access court decisions and case law
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Court Level Filter */}
          <Select
            value={court || "all"}
            onValueChange={(value) =>
              updateParams({ court: value, page: "1" })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by court" />
            </SelectTrigger>
            <SelectContent>
              {courtLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <div className="ml-auto">
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
                Failed to load judgments. Please try again.
              </p>
            </CardContent>
          </Card>
        )}

        {filteredItems && filteredItems.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Gavel className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No judgments found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {court
                  ? `No judgments from ${courtLevels.find((c) => c.value === court)?.label}`
                  : "No judgments available"}
              </p>
            </CardContent>
          </Card>
        )}

        {filteredItems && filteredItems.length > 0 && (
          <div className="space-y-2">
            {filteredItems.map((judgment) => (
              <Link key={judgment.id} href={`/document/${judgment.id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium leading-tight">
                          {judgment.title}
                        </h3>
                        {judgment.case_number && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {judgment.case_number}
                          </p>
                        )}
                      </div>
                      {judgment.court_level && (
                        <Badge variant="secondary" className="shrink-0">
                          {judgment.court_level.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {judgment.publication_date && (
                        <span>
                          {formatDateOnly(judgment.publication_date)}
                        </span>
                      )}
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

export default function JudgmentsPage() {
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
      <JudgmentsContent />
    </Suspense>
  );
}
