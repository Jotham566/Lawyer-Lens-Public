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

interface CancelDraftDialogProps {
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
 * Confirmation modal for cancelling a running contract drafting job.
 *
 * Cooperative cancellation — the worker checks for the cancel flag
 * between section LLM calls (~10s windows). The dialog explains this
 * lag so the user doesn't expect instant abort. Phase rolls back to
 * REQUIREMENTS so the user can edit and resubmit.
 *
 * Distinct from the StageRollbackDialog (which is for completed
 * sessions). This one is for IN-FLIGHT drafts.
 */
export function CancelDraftDialog({
  open,
  loading = false,
  onConfirm,
  onCancel,
}: CancelDraftDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this draft?</AlertDialogTitle>
          <AlertDialogDescription>
            The drafter will stop within ~10 seconds and discard whatever
            it has generated so far. We&apos;ll keep your parties,
            jurisdiction, and answers so the form pre-fills when you
            return to the requirements stage. You can edit and click
            Generate again any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={loading}>
              Keep drafting
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
                "Cancel draft"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
