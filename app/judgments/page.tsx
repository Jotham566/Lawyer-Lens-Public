"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
// import { useRouter } from "next/navigation";

import {
  Search,
  Scale,
  Building2,
  Landmark,
  Gavel,
  Calendar,
  Tag,
  Bookmark,
  Share2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDocuments, getJudgmentYears, getAvailableJudges } from "@/lib/api";
import type { JudgeInfo } from "@/lib/api/documents";
import type { Document } from "@/lib/api/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDateOnly } from "@/lib/utils/date-formatter";
import { Skeleton } from "@/components/ui/skeleton";

/* ────────────────────────────────────────────────────────────
   Court level config
   ──────────────────────────────────────────────────────────── */
const courtLevels = [
  // Apex Courts
  { id: "Supreme Court", label: "Supreme Court", icon: Scale, group: "Apex Courts" },
  { id: "Court of Appeal", label: "Court of Appeal", icon: Landmark, group: "Apex Courts" },
  { id: "Constitutional Court", label: "Constitutional Court", icon: Scale, group: "Apex Courts" },
  // High Court Divisions
  { id: "High Court", label: "High Court", icon: Building2, group: "High Court" },
  { id: "Commercial Court", label: "Commercial Court", icon: Building2, group: "High Court" },
  { id: "Anti Corruption Division", label: "Anti Corruption Division", icon: Building2, group: "High Court" },
  { id: "Civil Division", label: "Civil Division", icon: Building2, group: "High Court" },
  { id: "Criminal Division", label: "Criminal Division", icon: Building2, group: "High Court" },
  { id: "Family Division", label: "Family Division", icon: Building2, group: "High Court" },
  { id: "Land Division", label: "Land Division", icon: Building2, group: "High Court" },
  { id: "Industrial Court", label: "Industrial Court", icon: Building2, group: "High Court" },
  // Tribunals
  { id: "Tax Appeals Tribunal", label: "Tax Appeals Tribunal", icon: Landmark, group: "Tribunals" },
  { id: "PPDA Appeals Tribunal", label: "PPDA Appeals Tribunal", icon: Landmark, group: "Tribunals" },
  { id: "Equal Opportunities Commission", label: "Equal Opportunities Commission", icon: Landmark, group: "Tribunals" },
  { id: "Uganda Human Rights Commission", label: "Uganda Human Rights Commission", icon: Landmark, group: "Tribunals" },
] as const;

/* Legal area filter chips — TODO: re-enable when legal_area metadata available */

/* Year options are now loaded dynamically from the API */

/* ────────────────────────────────────────────────────────────
   Sort options
   ──────────────────────────────────────────────────────────── */
const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "A → Z", value: "title" },
] as const;

/* ════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function JudgmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourts, setSelectedCourts] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedJudge, setSelectedJudge] = useState<string>("");
  const [sortBy, setSortBy] = useState("newest");
  const PAGE_SIZE = 20;

  // Dynamic filter data from API
  const [yearOptions, setYearOptions] = useState<{ label: string; value: string }[]>([]);
  const [availableJudges, setAvailableJudges] = useState<JudgeInfo[]>([]);

  // Debounced search for API calls
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Map sort UI values to API params
  const sortParams = useMemo(() => {
    switch (sortBy) {
      case "newest": return { sort_by: "judgment_date", sort_order: "desc" as const };
      case "oldest": return { sort_by: "judgment_date", sort_order: "asc" as const };
      case "title": return { sort_by: "title", sort_order: "asc" as const };
      default: return { sort_by: "judgment_date", sort_order: "desc" as const };
    }
  }, [sortBy]);

  // Infinite query — React Query handles page accumulation natively
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "judgments-infinite",
      PAGE_SIZE,
      selectedCourts[0] || "",
      selectedYear,
      debouncedSearch,
      sortParams.sort_by,
      sortParams.sort_order,
    ],
    queryFn: ({ pageParam }) =>
      getDocuments({
        document_type: "judgment",
        page: pageParam,
        size: PAGE_SIZE,
        court_level: selectedCourts[0] || undefined,
        year_from: selectedYear ? parseInt(selectedYear, 10) : undefined,
        search: debouncedSearch || undefined,
        ...sortParams,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });

  // Flatten all pages into a single array (derived, no setState needed)
  const allItems = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  const hasMore = hasNextPage ?? false;

  // Infinite scroll via scroll event
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      const sentinel = sentinelRef.current;
      if (!sentinel) return;
      const rect = sentinel.getBoundingClientRect();
      if (rect.top < window.innerHeight + 300 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  });

  // Load filter options from API
  useEffect(() => {
    getJudgmentYears()
      .then((years) => {
        const opts = Object.entries(years)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, count]) => ({
            label: `${year} (${count})`,
            value: year,
          }));
        setYearOptions(opts);
      })
      .catch(() => {
        // Fallback: generate last 10 years
        const fallback = Array.from({ length: 10 }, (_, i) => {
          const y = new Date().getFullYear() - i;
          return { label: String(y), value: String(y) };
        });
        setYearOptions([{ label: "All Years", value: "" }, ...fallback]);
      });

    getAvailableJudges()
      .then(setAvailableJudges)
      .catch(() => setAvailableJudges([]));
  }, []);

  // Apply client-side judge filter on accumulated items (judge filter not in API yet)
  const judgments = useMemo(() => {
    if (!selectedJudge) return allItems;
    const q = selectedJudge.toLowerCase();
    return allItems.filter((j) =>
      j.judges?.some((judge: { name: string }) => judge.name.toLowerCase().includes(q))
    );
  }, [allItems, selectedJudge]);

  const totalResults = data?.pages[0]?.total || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is debounced and triggers API call automatically
  };

  const toggleCourt = (courtId: string) => {
    setSelectedCourts((prev) =>
      prev.includes(courtId)
        ? prev.filter((c) => c !== courtId)
        : [...prev, courtId]
    );
    // Filters changed — infinite query auto-resets via queryKey
  };

  const resetFilters = () => {
    setSelectedCourts([]);
    setSelectedYear("");
    setSelectedJudge("");
    setSearchQuery("");
    // Filters changed — infinite query auto-resets via queryKey
  };

  return (
    <div className="min-h-screen">
      {/* ── Search Header ── */}
      <div className="px-6 pb-4 pt-8 lg:px-12">
        <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-full bg-card shadow-soft ring-1 ring-border/60 transition-all focus-within:ring-[3px] focus-within:ring-primary/50 dark:ring-glass dark:focus-within:ring-brand-gold/40">
            <div className="flex items-center px-5 py-3">
              <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Supreme Court, High Court judgments..."
                className="min-w-0 flex-1 border-0 bg-transparent text-sm font-sans shadow-none ring-0 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </form>
      </div>

      {/* ── Main Layout: Filters + Results ── */}
      <div className="flex gap-0 px-6 pb-16 lg:px-12">
        {/* Filters Sidebar */}
        <aside className="hidden w-64 shrink-0 pr-8 lg:block">
          <div className="sticky top-24">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-foreground">
                Advanced Filters
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[10px] font-bold text-brand-gold underline underline-offset-4 hover:text-brand-gold-soft"
              >
                Reset
              </button>
            </div>

            <div className="space-y-8">
              {/* Court Level */}
              <div>
                <label className="ll-label-xs mb-3 block">Court Level</label>
                <div className="space-y-2.5">
                  {courtLevels.map((court) => (
                    <label
                      key={court.id}
                      className="group flex cursor-pointer items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourts.includes(court.id)}
                        onChange={() => toggleCourt(court.id)}
                        className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-foreground/80 ll-transition group-hover:text-foreground">
                        {court.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Decision Year */}
              <div>
                <label className="ll-label-xs mb-3 block">Decision Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    // Filters changed — infinite query auto-resets via queryKey
                  }}
                  className="w-full rounded-xl border-0 bg-surface-container px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Years</option>
                  {yearOptions.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Legal Area — TODO: add back when legal_area metadata is available via LLM extraction */}

              {/* Judge / Coram Filter */}
              <div>
                <label className="ll-label-xs mb-3 block">
                  Judge / Coram
                </label>
                <div className="relative">
                  <Gavel className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={selectedJudge}
                    onChange={(e) => {
                      setSelectedJudge(e.target.value);
                      // Filters changed — infinite query auto-resets via queryKey
                    }}
                    placeholder="Search by name..."
                    className="w-full rounded-xl border-0 bg-surface-container py-3 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary"
                    list="judge-suggestions"
                  />
                  <datalist id="judge-suggestions">
                    {availableJudges.map((j) => (
                      <option key={j.name} value={j.name}>
                        {j.title} {j.name} ({j.count} case{j.count !== 1 ? "s" : ""})
                      </option>
                    ))}
                  </datalist>
                </div>
                {selectedJudge && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJudge("");
                      // Filters changed — infinite query auto-resets via queryKey
                    }}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground ll-transition"
                  >
                    Clear judge filter
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Results Section */}
        <section className="min-w-0 flex-1">
          {/* Results Header */}
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <h1 className="ll-heading-xl text-2xl lg:text-3xl">
                Search Results
              </h1>
              <p className="mt-1 font-serif text-base text-muted-foreground">
                {isLoading
                  ? "Loading judgments..."
                  : `Showing ${totalResults} judgment${totalResults !== 1 ? "s" : ""} matching your criteria`}
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-surface-container-high px-4 py-2 sm:flex">
              <span className="ll-label-xs">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-0 bg-transparent p-0 text-[10px] font-bold uppercase tracking-widest text-foreground focus:ring-0"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Judgment Cards */}
          <div className="space-y-6">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-transparent bg-card p-8 shadow-soft dark:border-glass"
                >
                  <Skeleton className="mb-3 h-5 w-40" />
                  <Skeleton className="mb-2 h-7 w-3/4" />
                  <Skeleton className="mb-6 h-4 w-1/2" />
                  <Skeleton className="mb-4 h-24 w-full rounded-xl" />
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-40 rounded-xl" />
                    <Skeleton className="h-10 w-36 rounded-xl" />
                  </div>
                </div>
              ))
            ) : judgments.length === 0 ? (
              <div className="rounded-xl border border-transparent bg-card p-12 text-center shadow-soft dark:border-glass">
                <Gavel className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  No judgments found matching your filters
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 text-sm font-semibold text-brand-gold hover:text-brand-gold-soft"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              judgments.map((judgment) => (
                <JudgmentCard key={judgment.id} judgment={judgment} />
              ))
            )}
          </div>

          {/* Load more — sentinel for auto-scroll + manual button */}
          <div ref={sentinelRef} className="flex flex-col items-center gap-4 pb-12 pt-8">
            {isFetchingNextPage && (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
                <span className="ll-label-xs">Loading more judgments...</span>
              </div>
            )}
            {hasMore && !isFetchingNextPage && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                className="rounded-full border border-border/60 px-6 py-2.5 text-xs font-bold uppercase tracking-widest ll-transition hover:bg-primary hover:text-primary-foreground dark:border-glass"
              >
                Load More Judgments
              </button>
            )}
            {!hasMore && judgments.length > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Showing all {totalResults} judgments
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Judgment Card Component
   ──────────────────────────────────────────────────────────── */
function JudgmentCard({ judgment }: { judgment: Document }) {
  const [bookmarked, setBookmarked] = useState(false);

  // Prefer judgment_date (actual decision date), fall back to publication_date
  const judgmentDateStr = judgment.judgment_date || judgment.publication_date;
  const formattedDate = judgmentDateStr
    ? formatDateOnly(judgmentDateStr)
    : null;

  const handleShare = async () => {
    const url = `${window.location.origin}/document/${judgment.id}`;
    const title = judgment.title;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or share failed — fall back to clipboard
        await navigator.clipboard.writeText(url);
      }
    } else {
      await navigator.clipboard.writeText(url);
      // Brief visual feedback
      const btn = document.activeElement as HTMLButtonElement;
      if (btn) {
        const original = btn.title;
        btn.title = "Link copied!";
        setTimeout(() => { btn.title = original; }, 2000);
      }
    }
  };

  // Determine court badge style
  const isSupreme = judgment.court_level
    ?.toLowerCase()
    .includes("supreme");
  const courtBadgeClass = isSupreme
    ? "bg-primary text-primary-foreground"
    : "bg-surface-container-high text-foreground";

  const documentHref = `/document/${judgment.id}?returnTo=${encodeURIComponent("/judgments")}&from=judgments`;

  return (
    <div className="relative overflow-hidden rounded-xl border border-transparent bg-card p-6 shadow-soft ll-transition hover:shadow-floating dark:border-glass lg:p-8">
      {/* Left accent bar */}
      <div className="absolute bottom-0 left-0 top-0 w-1 bg-brand-gold" />

      {/* Top row: Court badge + actions */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          {judgment.court_level && (
            <span
              className={cn(
                "mb-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                courtBadgeClass
              )}
            >
              {judgment.court_level}
            </span>
          )}
          <h3 className="text-xl font-extrabold leading-tight lg:text-2xl">
            <Link href={documentHref} className="hover:text-brand-gold ll-transition">
              {judgment.title}
            </Link>
          </h3>
          {/* Metadata row */}
          <div className="mt-2 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {judgment.case_number && (
              <span className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                {judgment.case_number}
              </span>
            )}
            {formattedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formattedDate}
              </span>
            )}
            {judgment.judges && judgment.judges.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Gavel className="h-3.5 w-3.5" />
                {judgment.judges.map((j) => j.name).join(", ")}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
            onClick={() => setBookmarked(!bookmarked)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full ll-transition",
              bookmarked
                ? "bg-brand-gold/20 text-brand-gold"
                : "bg-surface-container-high text-foreground hover:bg-surface-container-highest"
            )}
          >
            <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
          </button>
          <button
            type="button"
            title="Share"
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-foreground ll-transition hover:bg-surface-container-highest"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AI Case Summary — grounded ratio decidendi from LLM extraction */}
      {judgment.ai_summary ? (
        <div className="mb-6 rounded-xl border-l-2 border-border/30 bg-surface-container-low p-5 dark:border-glass/30">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-700 dark:text-brand-gold" />
            <span className="ll-label-xs text-brand-700 dark:text-brand-gold">
              AI Case Summary
            </span>
          </div>
          <p className="font-serif text-base italic leading-relaxed text-foreground/90">
            {judgment.ai_summary}
          </p>
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={documentHref}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground ll-transition hover:opacity-90"
        >
          View Full Judgment
        </Link>
        <Link
          href={`/chat?doc=${judgment.id}&q=${encodeURIComponent(
            `Provide a full case analysis of "${judgment.title}"${judgment.case_number ? ` (${judgment.case_number})` : ""}. ` +
            `Cover: (1) Material Facts, (2) Issues for Determination, (3) Ratio Decidendi, ` +
            `(4) Key Legal Principles Applied, (5) Obiter Dicta, (6) Orders/Outcome, ` +
            `and (7) Practical Implications for legal practitioners.`
          )}`}
          className="text-xs font-bold uppercase tracking-widest text-brand-700 underline-offset-4 ll-transition hover:underline dark:text-brand-gold"
        >
          Full AI Case Analysis
        </Link>
      </div>
    </div>
  );
}
