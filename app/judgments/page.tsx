"use client";

import { useMemo, useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAllDocumentsByType } from "@/lib/hooks";
import type { Document } from "@/lib/api/types";
import { formatDateOnly } from "@/lib/utils/date-formatter";
import { Skeleton } from "@/components/ui/skeleton";

/* ────────────────────────────────────────────────────────────
   Court level config
   ──────────────────────────────────────────────────────────── */
const courtLevels = [
  { id: "supreme_court", label: "Supreme Court", icon: Scale },
  { id: "court_of_appeal", label: "Court of Appeal", icon: Landmark },
  { id: "high_court", label: "High Court", icon: Building2 },
] as const;

/* ────────────────────────────────────────────────────────────
   Legal area filter chips
   ──────────────────────────────────────────────────────────── */
const legalAreas = [
  "Criminal",
  "Civil",
  "Land",
  "Constitutional",
  "Commercial",
  "Family",
] as const;

/* ────────────────────────────────────────────────────────────
   Year options
   ──────────────────────────────────────────────────────────── */
const yearOptions = Array.from({ length: 10 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { label: String(y), value: String(y) };
});
yearOptions.push({ label: "Earlier", value: "earlier" });

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
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(10);

  // Fetch all judgments via hook
  const { data: allJudgments, isLoading } = useAllDocumentsByType("judgment");

  // Filter and sort judgments
  const filteredJudgments = useMemo(() => {
    if (!allJudgments) return [];
    let results = [...allJudgments];

    // Court level filter
    if (selectedCourts.length > 0) {
      results = results.filter((j) =>
        selectedCourts.some((c) =>
          j.court_level?.toLowerCase().includes(c.replace("_", " "))
        )
      );
    }

    // Year filter
    if (selectedYear && selectedYear !== "") {
      if (selectedYear === "earlier") {
        const cutoff = new Date().getFullYear() - 9;
        results = results.filter((j) => {
          const year = j.publication_date
            ? new Date(j.publication_date).getFullYear()
            : null;
          return year !== null && year < cutoff;
        });
      } else {
        const yr = parseInt(selectedYear, 10);
        results = results.filter((j) => {
          const year = j.publication_date
            ? new Date(j.publication_date).getFullYear()
            : null;
          return year === yr;
        });
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.case_number?.toLowerCase().includes(q) ||
          j.court_level?.toLowerCase().includes(q)
      );
    }

    // Sort
    results.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.publication_date || 0).getTime() -
          new Date(a.publication_date || 0).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.publication_date || 0).getTime() -
          new Date(b.publication_date || 0).getTime()
        );
      }
      return a.title.localeCompare(b.title);
    });

    return results;
  }, [allJudgments, selectedCourts, selectedYear, selectedArea, searchQuery, sortBy]);

  const visibleJudgments = filteredJudgments.slice(0, visibleCount);
  const hasMore = visibleCount < filteredJudgments.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the filter above — no navigation needed
  };

  const toggleCourt = (courtId: string) => {
    setSelectedCourts((prev) =>
      prev.includes(courtId)
        ? prev.filter((c) => c !== courtId)
        : [...prev, courtId]
    );
    setVisibleCount(10);
  };

  const resetFilters = () => {
    setSelectedCourts([]);
    setSelectedYear("");
    setSelectedArea("");
    setSearchQuery("");
    setVisibleCount(10);
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
                    setVisibleCount(10);
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

              {/* Legal Area */}
              <div>
                <label className="ll-label-xs mb-3 block">Legal Area</label>
                <div className="flex flex-wrap gap-2">
                  {legalAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setSelectedArea(
                          selectedArea === area ? "" : area
                        );
                        setVisibleCount(10);
                      }}
                      className={cn(
                        "ll-transition rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider",
                        selectedArea === area
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-container text-foreground hover:bg-surface-container-high"
                      )}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Judge Search */}
              <div>
                <label className="ll-label-xs mb-3 block">
                  Judge / Coram
                </label>
                <div className="relative">
                  <Gavel className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    className="w-full rounded-xl border-0 bg-surface-container py-3 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
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
                  : `Showing ${filteredJudgments.length} judgment${filteredJudgments.length !== 1 ? "s" : ""} matching your criteria`}
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
            ) : visibleJudgments.length === 0 ? (
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
              visibleJudgments.map((judgment) => (
                <JudgmentCard key={judgment.id} judgment={judgment} />
              ))
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pb-12 pt-8">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 10)}
                className="group flex flex-col items-center gap-2"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 ll-transition group-hover:bg-primary group-hover:text-primary-foreground dark:border-glass">
                  <ChevronDown className="h-5 w-5" />
                </span>
                <span className="ll-label-xs">Load more cases</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Judgment Card Component
   ──────────────────────────────────────────────────────────── */
function JudgmentCard({ judgment }: { judgment: Document }) {
  const formattedDate = judgment.publication_date
    ? formatDateOnly(judgment.publication_date)
    : null;

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
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            title="Bookmark"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-foreground ll-transition hover:bg-surface-container-highest"
          >
            <Bookmark className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Share"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-foreground ll-transition hover:bg-surface-container-highest"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AI Summary placeholder — would come from a future AI summary API */}
      <div className="mb-6 rounded-xl border-l-2 border-border/30 bg-surface-container-low p-5 dark:border-glass/30">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-700 dark:text-brand-gold" />
          <span className="ll-label-xs text-brand-700 dark:text-brand-gold">
            AI Case Summary
          </span>
        </div>
        <p className="font-serif text-base italic leading-relaxed text-foreground/90">
          {judgment.long_title || judgment.short_title || judgment.title}
        </p>
      </div>

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
