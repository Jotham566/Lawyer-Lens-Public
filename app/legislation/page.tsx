"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Gavel,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRepositoryStats, getTopCitedDocuments } from "@/lib/api";
import type { CitedDocumentSummary } from "@/lib/api/citations";
import type { RepositoryStats } from "@/lib/api/types";
import { useReadingHistory } from "@/lib/stores";
import { formatDistanceToNow } from "date-fns";

/* ────────────────────────────────────────────────────────────
   Category navigation chips — each links to its dedicated page
   ──────────────────────────────────────────────────────────── */
const categories = [
  { label: "All Resources", value: "all", href: "/legislation" },
  { label: "Laws", value: "act", href: "/legislation/acts" },
  { label: "Judgements", value: "judgment", href: "/judgments" },
  { label: "Regulations", value: "regulation", href: "/legislation/regulations" },
  { label: "Bills", value: "bill", href: "/search?type=bill" },
  { label: "Internal KB", value: "kb", href: "/knowledge-base" },
] as const;

/* ────────────────────────────────────────────────────────────
   Document type → icon / label mapping
   ──────────────────────────────────────────────────────────── */
const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  act: { label: "Legislation", icon: FileText },
  judgment: { label: "Case Citation", icon: Gavel },
  regulation: { label: "Regulation", icon: ShieldCheck },
  constitution: { label: "Constitutional Law", icon: FileText },
  bill: { label: "Bill", icon: FileText },
};

function getDocTypeConfig(docType: string) {
  return typeConfig[docType] || { label: docType, icon: FileText };
}

/* ════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function LegislationPage() {
  const router = useRouter();
  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [topCited, setTopCited] = useState<CitedDocumentSummary[]>([]);
  const [trendingLoaded, setTrendingLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Real data hooks
  const readingHistory = useReadingHistory();

  useEffect(() => {
    getRepositoryStats().then(setStats).catch(console.error);
    getTopCitedDocuments(3)
      .then(setTopCited)
      .catch(() => {})
      .finally(() => setTrendingLoaded(true));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Use reading history if available, otherwise fall back to recent documents from API
  const recentItems =
    readingHistory.length > 0
      ? readingHistory.slice(0, 3).map((h) => ({
          id: h.documentId,
          title: h.title,
          docType: h.documentType,
          time: formatDistanceToNow(new Date(h.lastAccessedAt), {
            addSuffix: true,
          }),
          href: `/document/${h.documentId}?returnTo=${encodeURIComponent("/legislation")}&from=legislation`,
        }))
      : (stats?.recent_documents || []).slice(0, 3).map((doc) => ({
          id: doc.id,
          title: doc.title,
          docType: doc.document_type,
          time: doc.publication_date
            ? new Date(doc.publication_date).getFullYear().toString()
            : "",
          href: `/document/${doc.id}?returnTo=${encodeURIComponent("/legislation")}&from=legislation`,
        }));

  // Build trending items — prefer top-cited, fall back to recent documents
  // Badge colors: light mode uses dark text on tinted bg; dark mode uses light/gold text on tinted bg
  const badgePrimary = "bg-primary/10 text-primary dark:bg-brand-gold/15 dark:text-brand-gold";
  const badgeGold = "bg-brand-gold-soft/50 text-brand-ink dark:bg-brand-gold/15 dark:text-brand-gold";

  const trendingSource =
    topCited.length > 0
      ? topCited.map((doc, i) => ({
          badge: i === 0 ? "Most Cited" : "Frequently Referenced",
          badgeColor: i === 0 ? badgePrimary : badgeGold,
          title: doc.title,
          subtitle: doc.document_type
            ? getDocTypeConfig(doc.document_type).label
            : "Legal Document",
          href: `/document/${doc.id}?returnTo=${encodeURIComponent("/legislation")}&from=legislation`,
        }))
      : (stats?.recent_documents || []).slice(0, 3).map((doc, i) => ({
          badge: i === 0 ? "Recently Updated" : "New Addition",
          badgeColor: i === 0 ? badgePrimary : badgeGold,
          title: doc.title,
          subtitle: doc.document_type
            ? getDocTypeConfig(doc.document_type).label
            : "Legal Document",
          href: `/document/${doc.id}?returnTo=${encodeURIComponent("/legislation")}&from=legislation`,
        }));

  const trendingItems = trendingSource;

  return (
    <div className="min-h-screen">
      {/* ── Hero Search Section ── */}
      <section className="px-6 pb-12 pt-8 lg:px-12 lg:pt-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="ll-display-lg text-3xl sm:text-4xl lg:text-5xl">
            Legal Research Hub
          </h1>
          <p className="mx-auto mt-3 max-w-2xl font-serif text-lg italic text-muted-foreground">
            Access the collective intelligence of Ugandan Jurisprudence and
            Regulatory Frameworks.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-10">
            <div className="relative mx-auto overflow-hidden rounded-full bg-card shadow-soft ring-1 ring-border/60 transition-all focus-within:ring-[3px] focus-within:ring-primary/50 dark:ring-glass dark:focus-within:ring-brand-gold/40">
              <div className="flex items-center px-5 py-3 sm:px-6 sm:py-4">
                <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground sm:mr-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search laws, case citations, or internal memos..."
                  className="min-w-0 flex-1 border-0 bg-transparent text-base font-sans shadow-none ring-0 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 sm:text-lg"
                />
                <button
                  type="submit"
                  className="ml-2 shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground ll-transition hover:opacity-90 sm:px-8 sm:py-3"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Category Navigation Chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => {
              const isActive = cat.value === "all";
              return (
                <Link
                  key={cat.value}
                  href={cat.href}
                  className={cn(
                    "ll-transition rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-ambient"
                      : "bg-surface-container-high text-foreground hover:bg-surface-container-highest"
                  )}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bento Grid: Recently Viewed + Trending ── */}
      <section className="px-6 pb-16 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Recently Viewed — 7 cols */}
          <div className="lg:col-span-7">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="ll-heading-lg text-xl">Recently Viewed</h2>
              <Link
                href="/settings/activity"
                className="ll-transition text-xs font-bold uppercase tracking-widest text-brand-700 hover:text-brand-600 dark:text-brand-gold dark:hover:text-brand-gold-soft"
              >
                View History
              </Link>
            </div>

            <div className="space-y-4">
              {recentItems.length > 0 ? (
                recentItems.map((doc, i) => {
                  const config = getDocTypeConfig(doc.docType);
                  const Icon = config.icon;
                  return (
                    <Link key={doc.id} href={doc.href}>
                      <div
                        className={cn(
                          "group flex items-start gap-5 rounded-xl border border-transparent bg-card p-5 shadow-soft ll-transition hover:-translate-y-0.5 hover:bg-primary hover:shadow-floating dark:border-glass",
                          i === 1 && "!border-l-2 !border-l-brand-gold"
                        )}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high ll-transition group-hover:bg-primary/80">
                          <Icon className="h-5 w-5 text-primary ll-transition group-hover:text-primary-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="ll-label-xs text-brand-700 dark:text-brand-gold group-hover:text-brand-gold-soft">
                              {config.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground ll-transition group-hover:text-primary-foreground/60">
                              {doc.time}
                            </span>
                          </div>
                          <h3 className="text-base font-bold leading-snug ll-transition group-hover:text-primary-foreground">
                            {doc.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                /* Empty state — no recent activity */
                <div className="rounded-xl border border-transparent bg-card p-8 text-center shadow-soft dark:border-glass">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    No recently viewed documents
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Documents you open will appear here for quick access
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trending in Uganda — 5 cols */}
          <div className="lg:col-span-5">
            <div className="flex h-full flex-col rounded-xl bg-surface-container-high p-6 lg:p-8">
              {/* Header */}
              <div className="mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-700 dark:text-brand-gold" />
                <h2 className="ll-heading-md text-lg">Trending in Uganda</h2>
              </div>

              {/* Topics — real top-cited + curated regulatory alert */}
              <div className="space-y-5">
                {!trendingLoaded && !stats ? (
                  /* Loading skeleton */
                  <div className="space-y-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="animate-pulse space-y-2 pb-5 border-b border-border/30 last:border-0">
                        <div className="h-4 w-20 rounded-full bg-muted/40" />
                        <div className="h-5 w-full rounded bg-muted/30" />
                        <div className="h-3 w-2/3 rounded bg-muted/20" />
                      </div>
                    ))}
                  </div>
                ) : trendingItems.length > 0 ? (
                  trendingItems.map((item, i) => (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "group flex flex-col gap-1",
                          i < trendingItems.length
                            ? "border-b border-border/30 pb-5"
                            : ""
                        )}
                      >
                        <span
                          className={cn(
                            "ll-label-xs w-max rounded-full px-2 py-0.5",
                            item.badgeColor
                          )}
                        >
                          {item.badge}
                        </span>
                        <h4 className="text-base font-bold leading-tight ll-transition group-hover:text-brand-gold">
                          {item.title}
                        </h4>
                        <p className="text-sm italic text-muted-foreground">
                          {item.subtitle}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : null}

                {/* Curated regulatory alert — editorial content */}
                <div className="flex flex-col gap-1">
                  <span className="ll-label-xs w-max rounded-full bg-destructive/10 px-2 py-0.5 text-destructive dark:bg-destructive/20">
                    Regulatory Alert
                  </span>
                  <h4 className="text-base font-bold leading-tight ll-transition hover:text-brand-gold">
                    Bank of Uganda Digital Currency Framework
                  </h4>
                  <p className="text-sm italic text-muted-foreground">
                    Update required for Fintech internal KB
                  </p>
                </div>
              </div>

              {/* AI Assistant CTA — uses navy bg in both modes for consistency */}
              <div className="mt-auto pt-6">
                <div className="relative overflow-hidden rounded-xl bg-[#002344] p-6">
                  <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
                  <h5 className="font-semibold text-white">
                    Legal AI Assistant
                  </h5>
                  <p className="mt-1 text-xs text-white/60">
                    Let our intelligence engine summarize case files for you.
                  </p>
                  <Link
                    href="/chat"
                    className="mt-4 block w-full rounded-lg bg-brand-gold py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-brand-ink ll-transition hover:opacity-90"
                  >
                    Start Briefing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section className="px-6 pb-16 lg:px-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-transparent bg-surface-container-low p-8 shadow-soft dark:border-glass lg:p-10">
            <span className="ll-display-sm block text-3xl lg:text-4xl">
              {stats ? `${stats.total_documents.toLocaleString()}+` : "—"}
            </span>
            <span className="ll-label-sm mt-1">Statutory Instruments</span>
          </div>
          <div className="rounded-xl border border-transparent bg-surface-container-low p-8 shadow-soft dark:border-glass lg:p-10">
            <span className="ll-display-sm block text-3xl lg:text-4xl">
              {stats
                ? (
                    stats.by_type.find((t) => t.document_type === "judgment")
                      ?.count || 0
                  ).toLocaleString()
                : "—"}
            </span>
            <span className="ll-label-sm mt-1">Court Judgements</span>
          </div>
          <div className="rounded-xl border border-transparent bg-surface-container-low p-8 shadow-soft dark:border-glass lg:p-10">
            <span className="ll-display-sm block text-3xl text-brand-700 dark:text-brand-gold lg:text-4xl">
              Real-time
            </span>
            <span className="ll-label-sm mt-1">Gazette Monitoring</span>
          </div>
        </div>
      </section>
    </div>
  );
}
