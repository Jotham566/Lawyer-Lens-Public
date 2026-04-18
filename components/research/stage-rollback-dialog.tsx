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

type RollbackTarget = "clarifying" | "brief_review";

interface StageRollbackDialogProps {
  /** When non-null, the dialog is open. Carries the target stage. */
  target: RollbackTarget | null;
  /** True while the reset call is in flight. Confirm button shows a spinner. */
  loading?: boolean;
  /** Fired when the user confirms the rollback. */
  onConfirm: () => void;
  /** Fired when the user cancels (Esc, Cancel button, or click-away). */
  onCancel: () => void;
}

const STAGE_COPY: Record<
  RollbackTarget,
  { title: string; body: string; action: string }
> = {
  clarifying: {
    title: "Return to clarification?",
    body:
      "This re-opens the clarifying questions and discards the generated " +
      "research brief. Any saved report content for this session will be " +
      "cleared so the next run can regenerate from your updated answers.",
    action: "Return to clarification",
  },
  brief_review: {
    title: "Return to the research brief?",
    body:
      "This drops you back to the brief-review stage so you can refine " +
      "topics or scope before re-running. The saved report content for " +
      "this session will be cleared once you re-run.",
    action: "Return to brief review",
  },
};

/**
 * Confirmation modal for the clickable stepper rollback. Lives in
 * a separate component because the same flow exists from both the
 * brief-review and complete views and we don't want a double-render
 * of the AlertDialog mounted across phases.
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
            {copy?.body || "This will reset the session to an earlier stage."}
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
