"use client";

import Link from "next/link";
import { FileText, Gavel, ScrollText, Scale, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRepositoryStats } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

/* ════════════════════════════════════════════════════════════
   BROWSE DOCUMENTS — Public discovery hub
   Uses the same layout patterns as judgments/acts pages
   ════════════════════════════════════════════════════════════ */
export default function BrowsePage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["repository-stats"],
    queryFn: getRepositoryStats,
    staleTime: 5 * 60 * 1000,
  });

  // Build counts from real stats
  const getCount = (type: string) => {
    if (!stats) return null;
    const found = stats.by_type.find((t) => t.document_type === type);
    return found?.count || 0;
  };

  const documentTypes = [
    {
      title: "Acts of Parliament",
      description: "Browse enacted legislation and statutes passed by Parliament",
      icon: FileText,
      href: "/legislation/acts",
      count: getCount("act"),
      badge: "Legislation",
    },
    {
      title: "Judgments & Case Law",
      description: "Access court decisions and case law from various courts and tribunals",
      icon: Gavel,
      href: "/judgments",
      count: getCount("judgment"),
      badge: "Case Law",
    },
    {
      title: "Regulations",
      description: "Find regulatory instruments, rules, and subsidiary legislation",
      icon: ScrollText,
      href: "/legislation/regulations",
      count: getCount("regulation"),
      badge: "Regulatory",
    },
    {
      title: "Constitution of Uganda",
      description: "The Constitution of the Republic of Uganda, 1995 (as amended)",
      icon: Scale,
      href: "/legislation/constitution",
      count: 1,
      badge: "Constitutional Law",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Breadcrumbs */}
      <div className="px-6 pt-4 lg:px-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/", isCurrentPage: false },
            { label: "Browse", href: "/browse", isCurrentPage: true },
          ]}
        />
      </div>

      {/* Header */}
      <div className="px-6 pb-2 pt-6 lg:px-12">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Browse Legal Documents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore Uganda&apos;s legal corpus organized by document type
        </p>
      </div>

      {/* Document Type Cards */}
      <div className="px-6 py-8 lg:px-12">
        <div className="grid gap-6 sm:grid-cols-2">
          {documentTypes.map((type) => (
            <Link key={type.href} href={type.href} className="group">
              <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-transparent bg-card p-6 shadow-soft ll-transition hover:-translate-y-0.5 hover:shadow-floating dark:border-glass lg:p-8">
                {/* Top row: badge + count */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-block rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                    {type.badge}
                  </span>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 rounded" />
                  ) : (
                    <span className="text-2xl font-extrabold tracking-tight text-muted-foreground/50">
                      {type.count !== null ? type.count.toLocaleString() : "—"}
                    </span>
                  )}
                </div>

                {/* Icon + Title */}
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10">
                    <type.icon className="h-6 w-6 text-brand-gold/80 ll-transition group-hover:text-brand-gold" />
                  </div>
                  <h2 className="text-xl font-extrabold leading-tight tracking-tight">
                    {type.title}
                  </h2>
                </div>

                {/* Description */}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {type.description}
                </p>

                {/* CTA */}
                <div className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-bold uppercase tracking-widest text-brand-700 dark:text-brand-gold">
                  Browse {type.title.split(" ")[0].toLowerCase()}
                  <ArrowRight className="h-3.5 w-3.5 ll-transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Total documents strip */}
        {stats && (
          <div className="mt-8 flex items-baseline gap-2 rounded-xl border border-transparent bg-surface-container-low p-6 dark:border-glass">
            <span className="text-2xl font-extrabold tracking-tight">
              {stats.total_documents.toLocaleString()}+
            </span>
            <span className="text-sm text-muted-foreground">
              total legal documents indexed across Uganda&apos;s legal corpus
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
