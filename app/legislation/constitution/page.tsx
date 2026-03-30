"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BookOpen, FileText, ExternalLink, Scale } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { useAllDocumentsByType } from "@/lib/hooks";

const constitutionHighlights = [
  { chapter: "Chapter 1", title: "The Constitution", description: "Supremacy and application of the constitution" },
  { chapter: "Chapter 4", title: "Human Rights", description: "Fundamental and other human rights and freedoms" },
  { chapter: "Chapter 7", title: "The Executive", description: "The President, Cabinet and Vice President" },
  { chapter: "Chapter 8", title: "The Judiciary", description: "Administration of Justice and courts" },
  { chapter: "Chapter 9", title: "Finance", description: "Public funds and taxation" },
  { chapter: "Chapter 15", title: "Land & Environment", description: "Land ownership and environmental protection" },
];

export default function ConstitutionPage() {
  const { data, isLoading, error } = useAllDocumentsByType("constitution");
  const constitution = useMemo(() => data?.[0] || null, [data]);
  const detailHref = constitution
    ? `/document/${constitution.id}?returnTo=${encodeURIComponent("/legislation/constitution")}&from=constitution`
    : null;

  return (
    <div className="min-h-screen">
      {/* Breadcrumbs */}
      <div className="px-6 pt-4 lg:px-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/", isCurrentPage: false },
            { label: "Legislation", href: "/legislation", isCurrentPage: false },
            { label: "Constitution", href: "/legislation/constitution", isCurrentPage: true },
          ]}
        />
      </div>

      {/* Header */}
      <div className="px-6 pb-4 pt-6 lg:px-12">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10">
            <Scale className="h-6 w-6 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              The Constitution of Uganda
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              The supreme law of the Republic of Uganda, 1995
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-16 lg:px-12">
        {/* Main Document Card */}
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="text-sm text-destructive">Failed to load constitution</p>
          </div>
        ) : constitution ? (
          <div className="rounded-xl border border-transparent bg-card p-6 shadow-soft dark:border-glass lg:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                Constitution
              </span>
              <span className="inline-block rounded-full bg-brand-gold/15 text-brand-ink dark:text-brand-gold px-3 py-1 text-[10px] font-bold">
                1995
              </span>
            </div>
            <h2 className="text-xl font-extrabold leading-tight lg:text-2xl">
              {constitution.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The Constitution of the Republic of Uganda, 1995, is the supreme law
              of Uganda. It establishes the structure of government, defines
              fundamental rights and freedoms, and sets out the principles that
              govern the nation.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                href={detailHref!}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground ll-transition hover:opacity-90"
              >
                <FileText className="h-4 w-4" />
                Read Full Text
              </Link>
              <Link
                href="/chat?q=What%20are%20the%20fundamental%20rights%20in%20Uganda's%20Constitution?"
                className="text-xs font-bold uppercase tracking-widest text-brand-700 underline-offset-4 ll-transition hover:underline dark:text-brand-gold"
              >
                AI Constitution Analysis
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-transparent bg-card p-12 text-center shadow-soft dark:border-glass">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">Constitution not found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The constitution document is not available in the database.
            </p>
          </div>
        )}

        {/* Key Chapters */}
        <div className="mt-10">
          <h2 className="text-lg font-bold tracking-tight">Key Chapters</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {constitutionHighlights.map((item) => (
              <div
                key={item.chapter}
                className="rounded-xl border border-transparent bg-card p-5 shadow-soft dark:border-glass"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                  {item.chapter}
                </span>
                <h3 className="mt-1 text-[15px] font-bold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* About + Metadata */}
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight">History</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The Constitution was promulgated on October 8, 1995, replacing the
              1967 constitution. It was drafted by a Constituent Assembly elected
              in 1994 and marked Uganda&apos;s return to constitutional governance.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Amendments</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The Constitution has been amended several times since 1995, with
              significant amendments in 2005 and 2017 modifying provisions
              including presidential term limits and age requirements.
            </p>
          </div>
        </div>

        {/* Metadata badges */}
        <div className="mt-6 flex flex-wrap gap-2">
          {["Enacted: 1995", "Last Amended: 2017", "20 Chapters", "287 Articles", "7 Schedules"].map((label) => (
            <span
              key={label}
              className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground"
            >
              {label}
            </span>
          ))}
        </div>

        {/* External Resources */}
        <div className="mt-10 border-t border-border/30 pt-8">
          <h2 className="text-lg font-bold tracking-tight">External Resources</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <a
              href="https://ulii.org/akn/ug/act/statute/1995/constitution/eng@1995-10-08"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-xs font-bold text-foreground ll-transition hover:bg-surface-container-high"
            >
              ULII Constitution Page
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://www.parliament.go.ug/documents/constitution"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-xs font-bold text-foreground ll-transition hover:bg-surface-container-high"
            >
              Parliament of Uganda
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
