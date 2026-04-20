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
import { Button } from "@/components/ui/button";

interface CancelResearchDialogProps {
  /** When true, the dialog is open. */
  open: boolean;
  /** True while the cancel API call is in flight. */
  loading?: boolean;
  /** Fired when the user confirms cancellation. */
  onConfirm: () => void;
  /** Fired when the user dismisses the dialog. */
  onCancel: () => void;
}

/**
 * Confirmation modal for cancelling a running deep research session.
 *
 * Cooperative cancellation — the supervisor checks the cancel flag
 * between subagent invocations (~10-30s windows depending on which
 * subagent is mid-run). Phase rolls back to BRIEF_REVIEW (if a brief
 * exists) or CLARIFYING with a "Cancelled by user" status.
 */
export function CancelResearchDialog({
  open,
  loading = false,
  onConfirm,
  onCancel,
}: CancelResearchDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this research?</AlertDialogTitle>
          <AlertDialogDescription>
            The research agents will stop within ~10-30 seconds and
            discard the in-progress findings. You&apos;ll be returned to
            the brief review stage so you can refine the query and
            resubmit. Your clarifying answers and brief are preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={loading}>
              Keep researching
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Cancel research"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
