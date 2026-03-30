"use client";

import { FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

/**
 * Bills page — placeholder for future implementation.
 * Will be structured like the Judgments page with bill summaries and metadata.
 */
export default function BillsPage() {
  return (
    <div className="min-h-screen">
      {/* Breadcrumbs */}
      <div className="px-6 pt-4 lg:px-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/", isCurrentPage: false },
            { label: "Legislation", href: "/legislation", isCurrentPage: false },
            { label: "Bills", href: "/legislation/bills", isCurrentPage: true },
          ]}
        />
      </div>

      {/* Header */}
      <div className="px-6 pb-4 pt-6 lg:px-12">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Bills
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track parliamentary bills through the legislative process
        </p>
      </div>

      {/* Coming Soon */}
      <div className="px-6 pb-16 lg:px-12">
        <div className="rounded-xl border border-transparent bg-card p-12 text-center shadow-soft dark:border-glass">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gold/10">
            <FileText className="h-8 w-8 text-brand-gold" />
          </div>
          <h3 className="mt-6 text-lg font-bold">Coming Soon</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The Bills tracking module is under development. You&apos;ll be able to
            search bills, view summaries, track amendments, and monitor the
            legislative process.
          </p>
        </div>
      </div>
    </div>
  );
}
