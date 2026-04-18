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
 * Visible-everywhere stage stepper for the Deep Research workspace.
 *
 * Until 2026-04-18 the stepper only rendered during the clarifying
 * phase, so once a user advanced they had no orientation cue
 * answering "where am I in this multi-step flow?". This is the
 * trunk-test failure called out in the UX audit.
 *
 * The component is read-only by design: backend currently doesn't
 * support resetting status (e.g., back from BRIEF_REVIEW to
 * CLARIFYING), so making steps clickable would lie to the user. We
 * surface tooltips with each step's purpose instead, and revisit
 * clickability when the backend supports proper rollback.
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

interface ResearchStageStepperProps {
  status: ResearchStatus | null | undefined;
  /** Optional className for layout callers (e.g., extra spacing). */
  className?: string;
  /** Compact variant: smaller chips, used inside dense headers. */
  compact?: boolean;
}

export function ResearchStageStepper({
  status,
  className,
  compact = false,
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
        return (
          <div key={stage.id} className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex items-center justify-center rounded-full border-2 transition-colors",
                    dot,
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary",
                    !isComplete && !isCurrent && "border-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className={dotIcon} aria-hidden="true" />
                  ) : isCurrent && (status === "researching" || status === "writing") ? (
                    <Loader2 className={cn(dotIcon, "animate-spin")} aria-hidden="true" />
                  ) : (
                    <span className={cn("font-medium", compact ? "text-[10px]" : "text-xs")}>
                      {index + 1}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{stage.label}</p>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
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
