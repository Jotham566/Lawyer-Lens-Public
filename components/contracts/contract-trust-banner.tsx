"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Trust banner shown above a finalised contract draft.
 *
 * The contracts pipeline already populates ``warnings`` and
 * ``compliance_notes`` on the draft and renders them as cards in the
 * right rail. The right rail is great for *reading the detail* but
 * easy to miss when a user is focused on the document canvas, about
 * to download the Word/PDF, or skimming for the approval CTA. A
 * weakly-grounded contract looked visually identical to a strongly-
 * grounded one.
 *
 * This is the contract-side mirror of the WeakResearchBanner that
 * /research already shows above the report (Phase A/4 of the Deep
 * Research remediation). Same trust problem, same surface affordance.
 *
 * Two variants:
 *
 * - ``warning`` (orange) — surfaced when ``draft.warnings`` is non-empty.
 *   Generated review notes the model wants the user to read before
 *   using the contract.
 * - ``compliance`` (red) — surfaced when ``draft.compliance_notes`` is
 *   non-empty. Statutory or regulatory considerations that apply.
 *
 * Both share role="status" + aria-live="polite" so screen readers
 * announce them on initial render of the finalised draft.
 */

interface ContractTrustBannerProps {
  warningCount?: number;
  complianceCount?: number;
  className?: string;
}

export function ContractTrustBanner({
  warningCount = 0,
  complianceCount = 0,
  className,
}: ContractTrustBannerProps) {
  if (warningCount === 0 && complianceCount === 0) return null;

  const lines: { icon: typeof AlertTriangle; tone: "warn" | "danger"; text: string }[] = [];
  if (warningCount > 0) {
    lines.push({
      icon: AlertTriangle,
      tone: "warn",
      text:
        warningCount === 1
          ? "1 review note attached. See the right-rail Review Notes panel before using this contract."
          : `${warningCount} review notes attached. See the right-rail Review Notes panel before using this contract.`,
    });
  }
  if (complianceCount > 0) {
    lines.push({
      icon: ShieldAlert,
      tone: "danger",
      text:
        complianceCount === 1
          ? "1 compliance note applies. Review the Compliance panel and verify with counsel before signing."
          : `${complianceCount} compliance notes apply. Review the Compliance panel and verify with counsel before signing.`,
    });
  }

  // Pick the strongest tone: compliance > warning. The whole banner
  // matches that tone so the visual weight escalates with severity.
  const headlineTone = complianceCount > 0 ? "danger" : "warn";
  const headline =
    complianceCount > 0
      ? "This contract has compliance notes — review before signing"
      : "This contract has review notes — read before using";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mb-6 flex gap-3 rounded-2xl border p-4",
        headlineTone === "danger"
          ? "border-destructive/40 bg-destructive/10 text-foreground"
          : "border-warning-border bg-warning-bg/60 text-warning-fg",
        className,
      )}
    >
      {headlineTone === "danger" ? (
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      ) : (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-fg" aria-hidden="true" />
      )}
      <div className="flex-1">
        <p className="font-semibold">{headline}</p>
        <ul className="mt-2 space-y-1 text-sm leading-relaxed">
          {lines.map((line, idx) => {
            const Icon = line.icon;
            return (
              <li key={idx} className="flex items-start gap-2">
                <Icon
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    line.tone === "danger" ? "text-destructive" : "text-warning-fg",
                  )}
                  aria-hidden="true"
                />
                <span>{line.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
