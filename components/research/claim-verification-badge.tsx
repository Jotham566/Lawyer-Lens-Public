"use client";

import { CheckCircle2, HelpCircle, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ClaimVerificationSummary } from "@/lib/api/research";

/**
 * Phase B/2 (2026-04-18): Claim-verification badge.
 *
 * Shows the aggregate NLI entailment verdict from the Deep Research
 * verifier on the report header. Three visual states:
 *
 * - **Verified (green)**: verification_rate >= 0.8 AND no contradictions.
 *   The model's claims map cleanly to the cited evidence.
 * - **Mixed (amber)**: verification_rate in [0.4, 0.8) OR any contradictions.
 *   Most claims are OK but some couldn't be supported — user should
 *   read carefully and verify the unsupported/contradicted ones.
 * - **Weak (red)**: verification_rate < 0.4 AND at least one claim
 *   checked. The writer's prose and the cited sources disagree often
 *   enough that the whole report warrants independent verification.
 * - **Skipped (grey)**: verifier didn't run (LLM rate-limited, missing
 *   API key, or claim_verification=null). Distinct from "0% verified"
 *   because the user should know we couldn't check vs we checked and
 *   found nothing supported.
 *
 * Without this badge, a report with bad entailment looks identical to
 * a perfectly-verified one on the UI. The Deep Research pipeline has
 * the data; the frontend just surfaces it.
 */

interface ClaimVerificationBadgeProps {
  summary: ClaimVerificationSummary | null | undefined;
  className?: string;
}

type Tone = "verified" | "mixed" | "weak" | "skipped";

function pickTone(summary: ClaimVerificationSummary): Tone {
  if (summary.skipped || summary.total_claims === 0) return "skipped";
  if (summary.contradicted_claims > 0 && summary.verification_rate < 0.8) {
    return "mixed";
  }
  if (summary.verification_rate >= 0.8) return "verified";
  if (summary.verification_rate >= 0.4) return "mixed";
  return "weak";
}

export function ClaimVerificationBadge({
  summary,
  className,
}: ClaimVerificationBadgeProps) {
  if (!summary) return null;

  const tone = pickTone(summary);
  const rate = Math.round(summary.verification_rate * 100);

  const icon = {
    verified: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    mixed: <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    weak: <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    skipped: <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
  }[tone];

  const label = {
    verified: `${rate}% of claims verified`,
    mixed:
      summary.contradicted_claims > 0
        ? `${rate}% verified · ${summary.contradicted_claims} contradicted`
        : `${rate}% of claims verified`,
    weak: `Only ${rate}% of claims verified`,
    skipped: summary.total_claims > 0 ? "Verification skipped" : "No claims to verify",
  }[tone];

  const toneClasses = {
    verified:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    mixed:
      "border-warning-border bg-warning-bg/60 text-warning-fg",
    weak:
      "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
    skipped:
      "border-neutral-300 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
  }[tone];

  const tooltip = buildTooltip(summary, tone);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses,
        className,
      )}
      title={tooltip}
      aria-label={`Claim verification: ${label}. ${tooltip}`}
      role="status"
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}

function buildTooltip(
  summary: ClaimVerificationSummary,
  tone: Tone,
): string {
  if (tone === "skipped") {
    return summary.skipped_reason || "Claim verification did not run for this report.";
  }
  const parts: string[] = [];
  parts.push(`${summary.verified_claims} verified`);
  if (summary.contradicted_claims > 0) {
    parts.push(`${summary.contradicted_claims} contradicted`);
  }
  if (summary.unsupported_claims > 0) {
    parts.push(`${summary.unsupported_claims} unsupported`);
  }
  parts.push(`of ${summary.total_claims} checked`);
  return parts.join(" · ");
}
