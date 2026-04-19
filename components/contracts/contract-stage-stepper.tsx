"use client";

import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Stage stepper for the Contract Drafting workspace.
 *
 * Mirrors ResearchStageStepper. Optional clickable rollback: when
 * the parent provides `onStageClick`, the "requirements" stage
 * renders as a button that fires the callback (callers handle the
 * actual reset call + confirm modal). Other stages stay non-
 * clickable: backend rejects every other rollback target.
 */

const STAGE_ORDER: { id: string; label: string; description: string }[] = [
  {
    id: "intake",
    label: "Intake",
    description: "Capture the commercial brief that will guide drafting.",
  },
  {
    id: "requirements",
    label: "Requirements",
    description: "Confirm parties, jurisdiction, and key contract variables.",
  },
  {
    id: "drafting",
    label: "Drafting",
    description: "Engine generates the full clause-by-clause draft.",
  },
  {
    id: "review",
    label: "Review",
    description: "Read, refine, and edit the generated draft.",
  },
  {
    id: "approval",
    label: "Approval",
    description: "Approve the final draft for export and signing.",
  },
  {
    id: "complete",
    label: "Complete",
    description: "Ready to download as Word or PDF.",
  },
];

type RollbackTarget = "requirements";

interface ContractStageStepperProps {
  phase: string | null | undefined;
  className?: string;
  compact?: boolean;
  /**
   * Fired when a user clicks a completed stage to roll back.
   * Currently the only meaningful target is "requirements" — the
   * backend rejects every other rollback target. Parent owns the
   * confirm-and-reset flow; we just emit the intent.
   */
  onStageClick?: (target: RollbackTarget) => void;
}

export function ContractStageStepper({
  phase,
  className,
  compact = false,
  onStageClick,
}: ContractStageStepperProps) {
  if (!phase || phase === "failed") return null;

  const currentIndex = STAGE_ORDER.findIndex((stage) => stage.id === phase);
  if (currentIndex < 0) return null;

  const dot = compact ? "h-6 w-6" : "h-8 w-8";
  const dotIcon = compact ? "h-3 w-3" : "h-4 w-4";

  return (
    <nav
      aria-label="Contract drafting progress"
      className={cn("flex items-center gap-1.5", className)}
    >
      {STAGE_ORDER.map((stage, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STAGE_ORDER.length - 1;
        // Only "requirements" is a valid rollback target right now;
        // everything else stays non-clickable. Mirrors the research
        // stepper which only allows clarifying / brief_review.
        const isClickable =
          Boolean(onStageClick) && isComplete && stage.id === "requirements";
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
        ) : isCurrent && phase === "drafting" ? (
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
