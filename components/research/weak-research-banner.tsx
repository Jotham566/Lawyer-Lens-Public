"use client";

import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Insufficient-info transparency banners for Deep Research reports.
 *
 * Phase A/4 (2026-04-18) of the Deep Research remediation. When the
 * supervisor's coverage evaluation could not produce useful results
 * for one or more topics (zero hits, all rejected by the relevance
 * filter, OR the LLM evaluator crashed and the fallback path fired),
 * the backend populates ``ResearchReport.weak_topics`` and
 * ``ResearchReport.weak_sections``. The frontend uses those to render
 * two complementary banners so users see, BEFORE acting on the report,
 * which sections were synthesised without solid statutory authority.
 *
 * Without these banners the previous behavior was to silently render a
 * clean-looking report. Codex outside-voice flagged this as the
 * single biggest user-trust risk in the Deep Research pipeline.
 *
 * Two banner variants:
 *
 * - **report-level** (top of report): summary banner shown when ANY
 *   weak topic exists. Calls out that this report has limited authority
 *   in some sections and recommends independent verification.
 * - **inline** (above each affected section): per-section reminder
 *   shown only above sections in ``weak_sections``. Carries the same
 *   message but scoped to the specific section.
 *
 * Both regions use ``role="status"`` + ``aria-live="polite"`` so screen
 * readers announce them on initial render without interrupting the
 * user's current navigation.
 */

interface WeakResearchBannerProps {
  variant: "report" | "inline";
  /** Number of weak topics — used in the report-level summary copy. */
  weakTopicCount?: number;
  /** Optional className override (e.g. spacing in a specific layout). */
  className?: string;
}

export function WeakResearchBanner({
  variant,
  weakTopicCount,
  className,
}: WeakResearchBannerProps) {
  const isReport = variant === "report";
  const headline = isReport
    ? "Limited authority found in some sections"
    : "Limited authority for this section";
  const body = isReport
    ? `Our research found insufficient statutory or judicial authority for ${
        weakTopicCount && weakTopicCount > 0
          ? weakTopicCount === 1
            ? "1 topic"
            : `${weakTopicCount} topics`
          : "some topics"
      } in this report. Affected sections are flagged below. Verify any conclusions independently before relying on them.`
    : "Our research found insufficient statutory or judicial authority for this section. Treat the analysis below as preliminary and verify independently before relying on it.";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex gap-3 rounded-2xl border border-warning-border bg-warning-bg/60 p-4 text-warning-fg",
        // Inline variant is slightly more compact — sits within section flow.
        isReport ? "mb-6" : "mb-4 text-sm",
        className,
      )}
    >
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-warning-fg"
        aria-hidden="true"
      />
      <div className="flex-1">
        <p className="font-semibold">{headline}</p>
        <p className="mt-1 text-sm leading-relaxed text-warning-fg/90">{body}</p>
      </div>
    </div>
  );
}
