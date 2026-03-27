"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Calendar,
  BookOpen,
  Bookmark,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDocuments } from "@/lib/api";
import type { Document } from "@/lib/api/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsDocumentSaved, useLibraryStore } from "@/lib/stores";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

const PAGE_SIZE = 20;

/* ────────────────────────────────────────────────────────────
   Sort options
   ──────────────────────────────────────────────────────────── */
const sortOptions = [
  { label: "Title A-Z", value: "title_asc", sort_by: "title", sort_order: "asc" },
  { label: "Title Z-A", value: "title_desc", sort_by: "title", sort_order: "desc" },
  { label: "Newest First", value: "newest", sort_by: "updated_at", sort_order: "desc" },
  { label: "Oldest First", value: "oldest", sort_by: "updated_at", sort_order: "asc" },
] as const;

/* ────────────────────────────────────────────────────────────
   Helper: extract year from act title (e.g., "Cap. 95-2006" → 2006)
   ──────────────────────────────────────────────────────────── */
function extractYear(doc: Document): string | null {
  if (doc.act_year) return doc.act_year.toString();
  // Try to extract from title: "...-2006" or "... 2006"
  const match = doc.title.match(/[-\s](\d{4})(?:\s|$)/);
  return match ? match[1] : null;
}

/* ────────────────────────────────────────────────────────────
   Helper: get the meaningful start of a title, stripping "The "
   ──────────────────────────────────────────────────────────── */
function titleForLetterFilter(title: string): string {
  return title.replace(/^the\s+/i, "");
}

/* ────────────────────────────────────────────────────────────
   Helper: extract chapter from title (e.g., "Cap. 95")
   ──────────────────────────────────────────────────────────── */
function extractChapter(doc: Document): string | null {
  if (doc.chapter) return `Cap. ${doc.chapter}`;
  const match = doc.title.match(/Cap\.?\s*(\d+)/i);
  return match ? `Cap. ${match[1]}` : null;
}

/* ════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function ActsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("title_asc");
  const [selectedLetter, setSelectedLetter] = useState<string>("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sortParams = useMemo(() => {
    const opt = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];
    return { sort_by: opt.sort_by, sort_order: opt.sort_order };
  }, [sortBy]);

  // Fetch acts with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["acts", debouncedSearch, sortBy],
    queryFn: ({ pageParam }) =>
      getDocuments({
        document_type: "act",
        page: pageParam,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        ...sortParams,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });

  // Flatten pages into single array, with client-side letter filter as safety net
  // Strip leading "The " so "The Income Tax Act" matches under "I", not "T"
  const allActs = useMemo(() => {
    const items = data?.pages.flatMap((p) => p.items) || [];
    if (selectedLetter) {
      return items.filter((act) =>
        titleForLetterFilter(act.title).toUpperCase().startsWith(selectedLetter)
      );
    }
    return items;
  }, [data, selectedLetter]);
  const totalCount = data?.pages[0]?.total || 0;

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Alphabet quick jump
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="min-h-screen">
      {/* Breadcrumbs */}
      <div className="px-6 pt-4 lg:px-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/", isCurrentPage: false },
            { label: "Legislation", href: "/legislation", isCurrentPage: false },
            { label: "Acts", href: "/legislation/acts", isCurrentPage: true },
          ]}
        />
      </div>

      {/* ── Search Header ── */}
      <div className="px-6 pb-4 pt-6 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-full bg-card shadow-soft ring-1 ring-border/60 transition-all focus-within:ring-[3px] focus-within:ring-primary/50 dark:ring-glass dark:focus-within:ring-brand-gold/40">
            <div className="flex items-center px-5 py-3">
              <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedLetter("");
                }}
                placeholder="Search acts by title, chapter, or keyword..."
                className="min-w-0 flex-1 border-0 bg-transparent text-base font-sans shadow-none ring-0 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Results Header + Sort ── */}
      <div className="px-6 pb-2 lg:px-12">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Acts of Parliament
            </h1>
            <p className="text-sm text-muted-foreground">
              Showing {allActs.length} of {totalCount} acts
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-0 bg-transparent text-[10px] font-bold uppercase tracking-widest text-foreground focus:ring-0"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Alphabet Quick Jump ── */}
      <div className="px-6 pb-6 lg:px-12">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => {
              setSelectedLetter("");
              setSearchQuery("");
            }}
            className={cn(
              "ll-transition h-8 w-8 rounded-full text-xs font-bold",
              !selectedLetter
                ? "bg-primary text-primary-foreground"
                : "bg-surface-container-high text-foreground hover:bg-surface-container-highest"
            )}
          >
            All
          </button>
          {alphabet.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => {
                setSelectedLetter(letter);
                setSearchQuery("");
              }}
              className={cn(
                "ll-transition h-8 w-8 rounded-full text-xs font-bold",
                selectedLetter === letter
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-container-high text-foreground hover:bg-surface-container-highest"
              )}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* ── Act Cards ── */}
      <div className="px-6 pb-16 lg:px-12">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))
          ) : allActs.length === 0 ? (
            <div className="rounded-xl border border-transparent bg-card p-12 text-center shadow-soft dark:border-glass">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">No acts found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || selectedLetter
                  ? "Try adjusting your search or filter"
                  : "No acts have been published yet"}
              </p>
            </div>
          ) : (
            allActs.map((act) => <ActCard key={act.id} act={act} />)
          )}

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-xs text-muted-foreground">Loading more acts...</span>
              </div>
            </div>
          )}

          {!hasNextPage && allActs.length > 0 && allActs.length >= PAGE_SIZE && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              All {totalCount} acts loaded
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Act Card Component
   ──────────────────────────────────────────────────────────── */
function ActCard({ act }: { act: Document }) {
  const [shareCopied, setShareCopied] = useState(false);

  // Persistent bookmark
  const isSaved = useIsDocumentSaved(act.id);
  const saveDocument = useLibraryStore((s) => s.saveDocument);
  const unsaveDocument = useLibraryStore((s) => s.unsaveDocument);

  const year = extractYear(act);
  const chapter = extractChapter(act);
  const documentHref = `/document/${act.id}?returnTo=${encodeURIComponent("/legislation/acts")}&from=acts`;

  const handleBookmark = () => {
    if (isSaved) {
      unsaveDocument(act.id);
    } else {
      saveDocument({
        id: act.id,
        humanReadableId: act.human_readable_id,
        title: act.title,
        documentType: act.document_type,
        actYear: act.act_year || (year ? parseInt(year, 10) : undefined),
      });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/document/${act.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: act.title, url });
        return;
      } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-transparent bg-card p-6 shadow-soft ll-transition hover:shadow-floating dark:border-glass">
      {/* Top row: badge + year + actions */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Badge row */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              Act
            </span>
            {year && (
              <span className="inline-block rounded-full bg-brand-gold/15 text-brand-ink dark:text-brand-gold px-3 py-1 text-[10px] font-bold">
                {year}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-extrabold leading-tight lg:text-2xl">
            <Link href={documentHref} className="ll-transition hover:text-brand-gold">
              {act.title}
            </Link>
          </h3>

          {/* Metadata row */}
          <div className="mt-2 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {chapter && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {chapter}
              </span>
            )}
            {act.commencement_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Commenced {act.commencement_date}
              </span>
            )}
            {act.short_title && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {act.short_title}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="ml-4 flex gap-2">
          <button
            type="button"
            title={isSaved ? "Remove from library" : "Save to library"}
            onClick={handleBookmark}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full ll-transition",
              isSaved
                ? "bg-brand-gold/20 text-brand-gold"
                : "bg-surface-container-high text-foreground hover:bg-surface-container-highest"
            )}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
          </button>
          <button
            type="button"
            title={shareCopied ? "Link copied!" : "Share"}
            onClick={handleShare}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full ll-transition",
              shareCopied
                ? "bg-status-success-bg text-status-success-fg"
                : "bg-surface-container-high text-foreground hover:bg-surface-container-highest"
            )}
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href={documentHref}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground ll-transition hover:opacity-90"
        >
          View Full Act
        </Link>
        <Link
          href={`/chat?doc=${act.id}&q=${encodeURIComponent(
            `Provide a comprehensive overview of the "${act.title}". Cover: (1) Purpose and Scope, (2) Key Provisions, (3) Definitions, (4) Penalties and Enforcement, and (5) Practical Implications for legal practitioners.`
          )}`}
          className="text-xs font-bold uppercase tracking-widest text-brand-700 underline-offset-4 ll-transition hover:underline dark:text-brand-gold"
        >
          AI Act Analysis
        </Link>
      </div>
    </div>
  );
}
