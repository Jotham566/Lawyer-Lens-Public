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
import { ShieldCheck, Info, ChevronDown, HelpCircle, AlertTriangle, Loader2 } from "lucide-react";
import type { VerificationStatus, ConfidenceInfo } from "@/lib/api/types";
import { getConfidenceTone, getToneStyles, getVerificationTone, surfaceClasses } from "@/lib/design-system";

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
  const tone = getToneStyles(getVerificationTone(level));

  switch (level) {
    case "verified":
      return {
        icon: ShieldCheck,
        surfaceClass: tone.surface,
        textColor: tone.text,
        iconColor: tone.icon,
        label: "Verified",
        animate: false,
      };
    case "partially_verified":
      {
        const infoTone = getToneStyles(getVerificationTone(level));
        return {
          icon: ShieldCheck,
          surfaceClass: infoTone.surface,
          textColor: infoTone.text,
          iconColor: infoTone.icon,
          label: "Mostly Verified",
          animate: false,
        };
      }
    case "analyzing":
      {
        const warningTone = getToneStyles(getVerificationTone(level));
        return {
          icon: Loader2,
          surfaceClass: warningTone.surface,
          textColor: warningTone.text,
          iconColor: `${warningTone.icon} animate-spin`,
          label: "Analyzing Sources...",
          animate: true,
        };
      }
    default: // unverified
      {
        const neutralTone = getToneStyles(getVerificationTone(level));
        return {
          icon: Info,
          surfaceClass: neutralTone.surface,
          textColor: neutralTone.text,
          iconColor: neutralTone.icon,
          label: "Review Suggested",
          animate: false,
        };
      }
  }
}

/**
 * Get confidence level styling.
 * All levels use positive/neutral language.
 */
function getConfidenceStyle(level: string) {
  const tone = getToneStyles(getConfidenceTone(level));
  switch (level) {
    case "high":
      return {
        barColor: tone.bar,
        textColor: tone.text,
        label: "High Confidence",
      };
    case "good":
      {
        const infoTone = getToneStyles(getConfidenceTone(level));
        return {
          barColor: infoTone.bar,
          textColor: infoTone.text,
          label: "Good Confidence",
        };
      }
    default: // moderate
      {
        const neutralTone = getToneStyles(getConfidenceTone(level));
        return {
          barColor: neutralTone.bar,
          textColor: neutralTone.text,
          label: "Moderate Confidence",
        };
      }
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
            "ll-status-button inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            style.surfaceClass,
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
        className="max-w-xs border border-border/80 bg-background p-3 shadow-[var(--shadow-floating)]"
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
        "rounded-lg p-3 space-y-3",
        verificationStyle.surfaceClass,
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
              className={cn("h-full rounded-full transition-all", getToneStyles("success").bar)}
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
              className={cn("h-full rounded-full transition-all", getToneStyles("info").bar)}
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
 * Confidence factor labels for display.
 * Each factor contributes to the overall confidence score with specific weights.
 */
const FACTOR_LABELS: Record<string, { label: string; description: string }> = {
  source_quality: {
    label: "Source Quality",
    description: "How relevant are the retrieved documents to your question. Higher means the sources closely match your query.",
  },
  source_coverage: {
    label: "Source Coverage",
    description: "Whether enough sources were found to support the response. More sources means better cross-verification.",
  },
  source_consensus: {
    label: "Source Consensus",
    description: "Whether multiple independent documents agree on the answer. Higher when different sources confirm the same information.",
  },
  source_recency: {
    label: "Source Recency",
    description: "How recent are the legal authorities cited. Important because laws may be amended over time.",
  },
  hallucination_score: {
    label: "Grounding Check",
    description: "Whether the response is actually supported by the sources. Verifies that cited sections and claims appear in the retrieved documents.",
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
        className={cn("flex items-center gap-1.5 text-xs", surfaceClasses.textLink)}
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
        <div className="space-y-2 rounded-md border border-border/50 bg-muted/50 p-2">
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
                              ? getToneStyles("success").bar
                              : scorePercent >= 60
                                ? getToneStyles("info").bar
                                : getToneStyles("neutral").bar
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
        "tone-neutral flex items-start gap-2 rounded-lg p-3",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--status-neutral-solid)]" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Verify this response
        </p>
        <p className="text-xs text-[color:var(--status-neutral-fg)]">
          This response has limited source support. We recommend verifying the
          information with primary legal sources before relying on it.
        </p>
        <div className="flex gap-2 pt-1">
          <a
            href="https://ulii.org"
            target="_blank"
            rel="noopener noreferrer"
            className={cn("text-xs underline-offset-4", surfaceClasses.textLink)}
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
            "inline-flex items-center gap-1 text-xs text-primary cursor-help",
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
