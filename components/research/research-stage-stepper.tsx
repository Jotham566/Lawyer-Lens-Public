"use client";

import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ResearchStatus } from "@/lib/api/research";
import { cn } from "@/lib/utils";

/**
 * Stage stepper for the Deep Research workspace.
 *
 * Visible across every phase view (clarifying, brief_review,
 * researching, writing, complete) so the user always has an
 * orientation cue answering "where am I in this multi-step flow?".
 *
 * Optional clickable rollback: when the parent provides
 * `onStageClick`, completed stages render as buttons that fire the
 * callback. The parent is responsible for the actual reset call
 * (POST /research/{id}/reset-to-stage) and for confirming with the
 * user before destroying in-flight work. Stages not yet reached and
 * the current stage are never clickable.
 */

const STAGE_ORDER: { id: ResearchStatus; label: string; description: string }[] = [
  {
    id: "clarifying",
    label: "Clarification",
    description: "Answer questions so the brief is precise.",
  },
  {
    id: "brief_review",
    label: "Review brief",
    description: "Approve the planned research topics and scope.",
  },
  {
    id: "researching",
    label: "Researching",
    description: "Sub-agents gather statutes, case law, and external sources.",
  },
  {
    id: "writing",
    label: "Writing",
    description: "Synthesising the cited report from collected evidence.",
  },
  {
    id: "complete",
    label: "Complete",
    description: "Report ready to read, edit, and export.",
  },
];

/** Subset of statuses that can be the *target* of a rollback. */
type RollbackTarget = "clarifying" | "brief_review";

interface ResearchStageStepperProps {
  status: ResearchStatus | null | undefined;
  /** Optional className for layout callers (e.g., extra spacing). */
  className?: string;
  /** Compact variant: smaller chips, used inside dense headers. */
  compact?: boolean;
  /**
   * Fired when a user clicks a completed stage to roll back.
   * Receives the target stage id (only "clarifying" or "brief_review"
   * are reachable — earlier stages don't exist in the flow, later
   * ones can't be jumped to). Parent owns the confirm-and-reset
   * flow; we just emit the intent.
   */
  onStageClick?: (target: RollbackTarget) => void;
}

export function ResearchStageStepper({
  status,
  className,
  compact = false,
  onStageClick,
}: ResearchStageStepperProps) {
  if (!status || status === "error" || status === "redirect_to_chat" || status === "redirect_to_contract") {
    return null;
  }

  const currentIndex = STAGE_ORDER.findIndex((stage) => stage.id === status);
  if (currentIndex < 0) return null;

  const dot = compact ? "h-6 w-6" : "h-8 w-8";
  const dotIcon = compact ? "h-3 w-3" : "h-4 w-4";

  return (
    <nav
      aria-label="Research progress"
      className={cn("flex items-center gap-1.5", className)}
    >
      {STAGE_ORDER.map((stage, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STAGE_ORDER.length - 1;
        // Only the first two stages are meaningful rollback targets:
        // "researching" / "writing" / "complete" are downstream and
        // can't be jumped to; clicking them mid-run would race with
        // the worker. The backend rejects anything but clarifying or
        // brief_review anyway.
        const isClickable =
          Boolean(onStageClick) &&
          isComplete &&
          (stage.id === "clarifying" || stage.id === "brief_review");
        const tooltipHint = isClickable
          ? "Click to return here and refine before re-running."
          : null;
        const dotClasses = cn(
          "flex items-center justify-center rounded-full border-2 transition-colors",
          dot,
          isComplete && "border-primary bg-primary text-primary-foreground",
          isCurrent && "border-primary bg-primary/10 text-primary",
          !isComplete && !isCurrent && "border-muted text-muted-foreground",
          isClickable && "cursor-pointer hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        );
        const dotInner = isComplete ? (
          <CheckCircle2 className={dotIcon} aria-hidden="true" />
        ) : isCurrent && (status === "researching" || status === "writing") ? (
          <Loader2 className={cn(dotIcon, "animate-spin")} aria-hidden="true" />
        ) : (
          <span className={cn("font-medium", compact ? "text-[10px]" : "text-xs")}>
            {index + 1}
          </span>
        );

        return (
          <div key={stage.id} className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                {isClickable ? (
                  <button
                    type="button"
                    aria-label={`Return to ${stage.label}`}
                    onClick={() => onStageClick?.(stage.id as RollbackTarget)}
                    className={dotClasses}
                  >
                    {dotInner}
                  </button>
                ) : (
                  <div
                    aria-current={isCurrent ? "step" : undefined}
                    className={dotClasses}
                  >
                    {dotInner}
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{stage.label}</p>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
                {tooltipHint && (
                  <p className="mt-1 text-xs text-primary">{tooltipHint}</p>
                )}
              </TooltipContent>
            </Tooltip>
            {!isLast && (
              <ChevronRight
                className={cn("text-muted-foreground", compact ? "mx-0.5 h-3 w-3" : "mx-1 h-4 w-4")}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
