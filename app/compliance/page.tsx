"use client";

import { ShieldCheck } from "lucide-react";
import { surfaceClasses } from "@/lib/design-system";
import { useRequireAuth } from "@/components/providers";
import { PageLoading } from "@/components/common";

export default function CompliancePage() {
  const { canShowContent } = useRequireAuth();

  if (!canShowContent) return <PageLoading />;

  return (
    <div className="ll-page-container">
      <div className={surfaceClasses.pageHero}>
        <div className={surfaceClasses.pageEyebrow}>
          <span className="ll-label-sm">Regulatory Compliance</span>
        </div>
        <div className={surfaceClasses.pageIconTile}>
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Regulatory Compliance
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track regulatory requirements, monitor compliance status, and stay ahead of legal obligations.
        </p>
      </div>

      <div className="mt-12 flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-2xl bg-surface-container p-4">
          <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Coming Soon</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The Regulatory Compliance module is under development. You&apos;ll be able to track compliance requirements, set up alerts, and manage regulatory deadlines.
        </p>
      </div>
    </div>
  );
}
