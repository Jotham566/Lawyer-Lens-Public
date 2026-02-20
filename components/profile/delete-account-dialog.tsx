"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers";
import { deleteAccount } from "@/lib/api/auth";
import { APIError } from "@/lib/api/client";
import { AlertBanner } from "@/components/common";

const CONFIRMATION_TEXT = "DELETE";

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmation: z.string().refine(
    (val) => val === CONFIRMATION_TEXT,
    `Please type "${CONFIRMATION_TEXT}" to confirm`
  ),
});

type DeleteAccountFormData = {
  password: string;
  confirmation: string;
};

interface DeleteAccountDialogProps {
  trigger?: React.ReactNode;
}

export function DeleteAccountDialog({ trigger }: DeleteAccountDialogProps) {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();

  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"warning" | "confirm">("warning");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form and state when closing
      reset();
      setError(null);
      setStep("warning");
    }
    setOpen(newOpen);
  };

  const onSubmit = async (data: DeleteAccountFormData) => {
    if (!isAuthenticated) return;

    setError(null);

    try {
      await deleteAccount({
        password: data.password,
        confirmation: data.confirmation,
      });

      // Clear auth state and redirect
      await logout();
      router.push("/?deleted=true");
    } catch (err) {
      if (err instanceof APIError) {
        if (err.errorCode === "INVALID_PASSWORD") {
          setError("Incorrect password. Please try again.");
        } else {
          setError(err.getUserMessage("Failed to delete account. Please try again."));
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  // Check if user uses OAuth (can't delete with password)
  const isOAuthUser = user?.auth_provider && user.auth_provider !== "email";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive">Delete Account</Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {step === "warning" ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-center">Delete Account?</DialogTitle>
              <DialogDescription className="text-center">
                This action cannot be undone. Your account and all associated data will be permanently deleted.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
              <p className="font-medium">What will be deleted:</p>
              <ul className="list-disc list-inside text-muted-foreground text-xs space-y-1">
                <li>Your profile and account settings</li>
                <li>All saved documents and bookmarks</li>
                <li>Chat history and research sessions</li>
                <li>Organization memberships</li>
              </ul>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep("confirm")}
              >
                Continue to Delete
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Account Deletion</DialogTitle>
              <DialogDescription>
                To confirm, please enter your password and type &quot;{CONFIRMATION_TEXT}&quot; below.
              </DialogDescription>
            </DialogHeader>

            {isOAuthUser ? (
              <div className="py-4">
                <AlertBanner
                  variant="warning"
                  message={`You signed in with ${user?.auth_provider}. Please contact support to delete your account.`}
                />
                <div className="mt-4">
                  <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <AlertBanner variant="error" message={error} />}

                <div className="space-y-2">
                  <Label htmlFor="delete-password">Password</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delete-confirmation">
                    Type <span className="font-mono font-bold">{CONFIRMATION_TEXT}</span> to confirm
                  </Label>
                  <Input
                    id="delete-confirmation"
                    type="text"
                    placeholder={CONFIRMATION_TEXT}
                    autoComplete="off"
                    {...register("confirmation")}
                  />
                  {errors.confirmation && (
                    <p className="text-sm text-destructive">{errors.confirmation.message}</p>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("warning")}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button type="submit" variant="destructive" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete My Account"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
