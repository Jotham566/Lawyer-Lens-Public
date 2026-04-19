"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type RollbackTarget = "requirements";

interface StageRollbackDialogProps {
  /** When non-null the dialog is open. Carries the target stage. */
  target: RollbackTarget | null;
  /** True while the reset call is in flight. */
  loading?: boolean;
  /** Fired when the user confirms the rollback. */
  onConfirm: () => void;
  /** Fired when the user cancels. */
  onCancel: () => void;
}

const STAGE_COPY: Record<
  RollbackTarget,
  { title: string; body: string; action: string }
> = {
  requirements: {
    title: "Return to requirements?",
    body:
      "This drops you back to the requirements stage so you can refine "
      + "parties, jurisdiction, or key terms before re-running. The "
      + "current draft will be cleared once you regenerate. Your "
      + "structured input (parties, answers, jurisdiction) is preserved "
      + "so the form pre-fills.",
    action: "Return to requirements",
  },
};

/**
 * Confirmation modal for the contracts clickable stepper rollback.
 * Mirrors the research StageRollbackDialog. Lives in a separate
 * component so we don't double-render when the same flow is wired
 * into multiple phase views.
 */
export function StageRollbackDialog({
  target,
  loading = false,
  onConfirm,
  onCancel,
}: StageRollbackDialogProps) {
  const copy = target ? STAGE_COPY[target] : null;
  return (
    <AlertDialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy?.title || "Return to earlier stage?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {copy?.body || "This will reset the contract to an earlier stage."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting…
              </>
            ) : (
              copy?.action || "Confirm"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
