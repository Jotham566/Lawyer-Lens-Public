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
 * Mirrors ResearchStageStepper. Until 2026-04-19 contracts had no
 * orientation cue answering "where am I in this multi-step flow?",
 * even though the underlying state machine has six distinct phases.
 * Users had no way to see the upstream/downstream stages.
 *
 * Read-only by design: contract phase resets are not yet supported
 * by the backend (the contracts pipeline doesn't have the same
 * reset-to-stage endpoint research does). Tooltips explain each
 * stage's purpose so the stepper is informative even without
 * clickable rollback. We can add clickability later when backend
 * support lands.
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

interface ContractStageStepperProps {
  phase: string | null | undefined;
  className?: string;
  compact?: boolean;
}

export function ContractStageStepper({
  phase,
  className,
  compact = false,
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
                  ) : isCurrent && phase === "drafting" ? (
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
