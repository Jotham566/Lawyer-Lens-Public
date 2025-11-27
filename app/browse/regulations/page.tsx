"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
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

function RegulationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading, error } = useDocumentsByType("regulation", page, 20);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/browse/regulations?${params.toString()}`);
  };

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
            <span className="text-foreground">Regulations</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <ScrollText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Regulations
              </h1>
              <p className="text-sm text-muted-foreground">
                Find regulatory instruments and subsidiary legislation
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-end gap-4">
          {/* Sort */}
          <Select defaultValue="title">
            <SelectTrigger className="h-9 w-[140px]">
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
                Failed to load regulations. Please try again.
              </p>
            </CardContent>
          </Card>
        )}

        {data?.items && data.items.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ScrollText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No regulations found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No regulations available
              </p>
            </CardContent>
          </Card>
        )}

        {data?.items && data.items.length > 0 && (
          <div className="space-y-2">
            {data.items.map((regulation) => (
              <Link key={regulation.id} href={`/document/${regulation.id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium leading-tight">
                          {regulation.title}
                        </h3>
                        {regulation.short_title && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {regulation.short_title}
                          </p>
                        )}
                      </div>
                      {regulation.act_year && (
                        <Badge variant="secondary" className="shrink-0">
                          {regulation.act_year}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {regulation.gazette_number && (
                        <span>Gazette: {regulation.gazette_number}</span>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
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
              Page {page} of {data.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pages}
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

export default function RegulationsPage() {
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
      <RegulationsContent />
    </Suspense>
  );
}
