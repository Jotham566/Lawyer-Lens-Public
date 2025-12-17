"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ShieldCheck, Info, ChevronDown, HelpCircle, AlertTriangle } from "lucide-react";
import type { VerificationStatus, ConfidenceInfo } from "@/lib/api/types";

interface TrustIndicatorProps {
  verification?: VerificationStatus;
  confidenceInfo?: ConfidenceInfo;
  className?: string;
  /** Compact mode for inline display */
  compact?: boolean;
}

/**
 * Get verification icon and color based on level.
 * Uses encouraging visual cues - no alarming colors.
 */
function getVerificationStyle(level: string) {
  switch (level) {
    case "verified":
      return {
        icon: ShieldCheck,
        bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
        borderColor: "border-emerald-200 dark:border-emerald-800",
        textColor: "text-emerald-700 dark:text-emerald-300",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        label: "Verified",
      };
    case "partially_verified":
      return {
        icon: ShieldCheck,
        bgColor: "bg-blue-50 dark:bg-blue-950/50",
        borderColor: "border-blue-200 dark:border-blue-800",
        textColor: "text-blue-700 dark:text-blue-300",
        iconColor: "text-blue-600 dark:text-blue-400",
        label: "Mostly Verified",
      };
    default: // unverified
      return {
        icon: Info,
        bgColor: "bg-slate-50 dark:bg-slate-950/50",
        borderColor: "border-slate-200 dark:border-slate-700",
        textColor: "text-slate-600 dark:text-slate-400",
        iconColor: "text-slate-500 dark:text-slate-500",
        label: "Review Suggested",
      };
  }
}

/**
 * Get confidence level styling.
 * All levels use positive/neutral language.
 */
function getConfidenceStyle(level: string) {
  switch (level) {
    case "high":
      return {
        barColor: "bg-emerald-500",
        textColor: "text-emerald-700 dark:text-emerald-300",
        label: "High Confidence",
      };
    case "good":
      return {
        barColor: "bg-blue-500",
        textColor: "text-blue-700 dark:text-blue-300",
        label: "Good Confidence",
      };
    default: // moderate
      return {
        barColor: "bg-slate-400",
        textColor: "text-slate-600 dark:text-slate-400",
        label: "Moderate Confidence",
      };
  }
}

/**
 * Compact trust badge for display next to messages.
 * Shows verification status with tooltip for details.
 */
export function TrustBadge({
  verification,
  confidenceInfo,
  className,
}: TrustIndicatorProps) {
  if (!verification) return null;

  const style = getVerificationStyle(verification.level);
  const Icon = style.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80",
            style.bgColor,
            style.borderColor,
            style.textColor,
            className
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", style.iconColor)} />
          <span>{style.label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs p-3 bg-popover border shadow-lg"
      >
        <TrustTooltipContent
          verification={verification}
          confidenceInfo={confidenceInfo}
        />
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Tooltip content showing verification details.
 * Uses positive, encouraging language.
 */
function TrustTooltipContent({
  verification,
  confidenceInfo,
}: {
  verification: VerificationStatus;
  confidenceInfo?: ConfidenceInfo;
}) {
  const verificationStyle = getVerificationStyle(verification.level);
  const confidenceStyle = confidenceInfo
    ? getConfidenceStyle(confidenceInfo.level)
    : null;

  return (
    <div className="space-y-3">
      {/* Verification Status */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <verificationStyle.icon
            className={cn("h-4 w-4", verificationStyle.iconColor)}
          />
          <span className={cn("font-medium", verificationStyle.textColor)}>
            {verificationStyle.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{verification.message}</p>
      </div>

      {/* Confidence Score */}
      {confidenceInfo && confidenceStyle && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Confidence</span>
            <span className={cn("text-xs", confidenceStyle.textColor)}>
              {confidenceStyle.label}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", confidenceStyle.barColor)}
              style={{ width: `${Math.round(confidenceInfo.score * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Verification Notes (max 2) */}
      {verification.notes.length > 0 && (
        <div className="pt-1 border-t">
          <ul className="space-y-1">
            {verification.notes.slice(0, 2).map((note, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-primary">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Full trust indicator panel for expanded view.
 * Shows all verification details in a card format.
 */
export function TrustIndicatorPanel({
  verification,
  confidenceInfo,
  className,
}: TrustIndicatorProps) {
  if (!verification) return null;

  const verificationStyle = getVerificationStyle(verification.level);
  const confidenceStyle = confidenceInfo
    ? getConfidenceStyle(confidenceInfo.level)
    : null;
  const Icon = verificationStyle.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-3",
        verificationStyle.bgColor,
        verificationStyle.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", verificationStyle.iconColor)} />
          <span className={cn("text-sm font-medium", verificationStyle.textColor)}>
            {verificationStyle.label}
          </span>
        </div>
        {confidenceInfo && confidenceStyle && (
          <span className={cn("text-xs", confidenceStyle.textColor)}>
            {Math.round(confidenceInfo.score * 100)}% confidence
          </span>
        )}
      </div>

      {/* Message */}
      <p className="text-xs text-muted-foreground">{verification.message}</p>

      {/* Score Bars */}
      <div className="space-y-2">
        {/* Source Grounding */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Source Grounding</span>
            <span className="font-medium">
              {Math.round(verification.source_grounding * 100)}%
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round(verification.source_grounding * 100)}%` }}
            />
          </div>
        </div>

        {/* Claim Support */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Claim Support</span>
            <span className="font-medium">
              {Math.round(verification.claim_support * 100)}%
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.round(verification.claim_support * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      {verification.notes.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <ul className="space-y-1">
            {verification.notes.map((note, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-primary shrink-0">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Minimal inline indicator (just icon + label).
 * For use in tight spaces like message footers.
 */
export function TrustIndicatorInline({
  verification,
  className,
}: Omit<TrustIndicatorProps, "confidenceInfo" | "compact">) {
  if (!verification) return null;

  const style = getVerificationStyle(verification.level);
  const Icon = style.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs cursor-help",
            style.textColor,
            className
          )}
        >
          <Icon className={cn("h-3 w-3", style.iconColor)} />
          <span>{style.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        {verification.message}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Confidence factor labels for display
 */
const FACTOR_LABELS: Record<string, { label: string; description: string }> = {
  source_coverage: {
    label: "Source Coverage",
    description: "How well the response is backed by legal sources",
  },
  claim_specificity: {
    label: "Claim Specificity",
    description: "How specific and precise the legal claims are",
  },
  citation_quality: {
    label: "Citation Quality",
    description: "Quality and relevance of cited legal documents",
  },
  legal_accuracy: {
    label: "Legal Accuracy",
    description: "Consistency with established legal principles",
  },
  context_match: {
    label: "Context Match",
    description: "How well the response addresses your specific question",
  },
  source_authority: {
    label: "Source Authority",
    description: "Weight of cited sources (Constitution, Acts, etc.)",
  },
};

/**
 * Get factor label and description
 */
function getFactorInfo(key: string): { label: string; description: string } {
  return FACTOR_LABELS[key] || {
    label: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    description: "Contributing factor to confidence score"
  };
}

/**
 * ConfidenceFactors - Expandable explanation of confidence factors
 */
export function ConfidenceFactors({
  confidenceInfo,
  className,
}: {
  confidenceInfo: ConfidenceInfo;
  className?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const factors = Object.entries(confidenceInfo.factors);

  if (factors.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={isOpen}
      >
        <HelpCircle className="h-3 w-3" />
        <span>Why this confidence?</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="space-y-2 p-2 rounded-md bg-muted/50 border border-border/50">
          <p className="text-[11px] text-muted-foreground">
            Confidence is calculated based on multiple factors:
          </p>
          <div className="space-y-1.5">
            {factors.map(([key, score]) => {
              const { label, description } = getFactorInfo(key);
              const scorePercent = Math.round(score * 100);
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <div className="space-y-0.5 cursor-help">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{scorePercent}%</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            scorePercent >= 80
                              ? "bg-emerald-500"
                              : scorePercent >= 60
                              ? "bg-blue-500"
                              : "bg-slate-400"
                          )}
                          style={{ width: `${scorePercent}%` }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs max-w-[200px]">
                    {description}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * UncertaintyDisclaimer - Shows when response has lower confidence
 *
 * Displayed for responses that may need additional verification
 */
export function UncertaintyDisclaimer({
  verification,
  className,
}: {
  verification: VerificationStatus;
  className?: string;
}) {
  // Only show for unverified responses
  if (verification.level !== "unverified") return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Verify this response
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          This response has limited source support. We recommend verifying the
          information with primary legal sources before relying on it.
        </p>
        <div className="flex gap-2 pt-1">
          <a
            href="https://ulii.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-700 dark:text-amber-300 underline hover:no-underline"
          >
            Uganda Legal Information Institute →
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * VerifyThisPrompt - Inline prompt suggesting verification
 */
export function VerifyThisPrompt({
  className,
}: {
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 cursor-help",
            className
          )}
        >
          <AlertTriangle className="h-3 w-3" />
          <span>Verify this</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-2">
        <p className="text-xs">
          This information should be verified against primary legal sources.
          Legal interpretations may vary and laws may have been amended.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
