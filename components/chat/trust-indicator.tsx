"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck, Info } from "lucide-react";
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
