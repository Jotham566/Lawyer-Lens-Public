"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Loader2, AlertTriangle, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth, useRequireAuth } from "@/components/providers";
import {
  updateProfile,
  getAccountDeletionStatus,
  cancelScheduledDeletion,
  type DeletionStatusResponse,
} from "@/lib/api/auth";
import { getUserFriendlyError } from "@/lib/api/client";
import { PageHeader, AlertBanner, PageLoading, StatusBadge } from "@/components/common";
import { AvatarUpload, DeleteAccountDialog } from "@/components/profile";
import { useResendVerification } from "@/lib/hooks";
import { formatDateOnly } from "@/lib/utils/date-formatter";

const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { user, isAuthenticated, refreshSession } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    resend,
    isSending: resendLoading,
    cooldown,
    success: resendSuccess,
    error: resendError,
    clearError: clearResendError,
  } = useResendVerification(isAuthenticated);

  // Deletion status state
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatusResponse | null>(null);
  const [deletionLoading, setDeletionLoading] = useState(true);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [deletionSuccess, setDeletionSuccess] = useState<string | null>(null);

  // Load deletion status
  useEffect(() => {
    async function loadDeletionStatus() {
      if (!isAuthenticated) return;

      try {
        const status = await getAccountDeletionStatus();
        setDeletionStatus(status);
      } catch (err) {
        console.error("Failed to load deletion status:", err);
      } finally {
        setDeletionLoading(false);
      }
    }

    if (isAuthenticated) {
      loadDeletionStatus();
    }
  }, [isAuthenticated]);

  const handleCancelScheduledDeletion = async () => {
    if (!isAuthenticated) return;

    setCancellingDeletion(true);
    setDeletionError(null);

    try {
      await cancelScheduledDeletion();
      setDeletionStatus({ status: "none" });
      setDeletionSuccess("Your scheduled account deletion has been cancelled.");
    } catch (err) {
      setDeletionError(getUserFriendlyError(err, "Failed to cancel deletion"));
    } finally {
      setCancellingDeletion(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      reset({ full_name: user.full_name });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!isAuthenticated) return;

    setError(null);
    setSuccess(null);

    try {
      await updateProfile({ full_name: data.full_name });
      await refreshSession();
      setSuccess("Profile updated successfully");
    } catch (err) {
      setError(getUserFriendlyError(err, "Failed to update profile"));
    }
  };

  const handleResendVerification = async () => {
    await resend();
  };

  if (authLoading || !user) {
    return <PageLoading message="Loading profile..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Manage your account information"
      />

      {/* Email Verification Banner */}
      {!user.email_verified && (
        <AlertBanner
          variant="warning"
          title="Verify your email address"
          message={
            resendSuccess
              ? "Verification email sent. Please check your inbox to access all features."
              : "Please verify your email to access all features."
          }
          action={{
            label: resendLoading
              ? "Sending..."
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend verification",
            onClick: handleResendVerification,
            disabled: resendLoading || cooldown > 0,
          }}
        />
      )}

      {(error || resendError) && (
        <AlertBanner
          variant="error"
          message={error || resendError || "An unexpected error occurred"}
          onDismiss={() => {
            setError(null);
            clearResendError();
          }}
        />
      )}

      {success && (
        <AlertBanner
          variant="success"
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details here</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    className="pl-10"
                    {...register("full_name")}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-sm text-destructive">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={user.email_verified ? "success" : "warning"}
                    label={user.email_verified ? "Verified" : "Not verified"}
                    showDot
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => reset({ full_name: user.full_name })}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Upload a photo to personalize your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            currentAvatarUrl={user.avatar_url}
            userName={user.full_name}
            onAvatarChange={() => refreshSession()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                Authentication Method
              </dt>
              <dd className="text-sm capitalize">{user.auth_provider}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                Account Created
              </dt>
              <dd className="text-sm">
                {formatDateOnly(user.created_at)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deletionError && (
            <AlertBanner
              variant="error"
              message={deletionError}
              onDismiss={() => setDeletionError(null)}
            />
          )}

          {deletionSuccess && (
            <AlertBanner
              variant="success"
              message={deletionSuccess}
              onDismiss={() => setDeletionSuccess(null)}
            />
          )}

          {deletionLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : deletionStatus?.status === "scheduled" ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    Account scheduled for deletion
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Your account will be permanently deleted on{" "}
                    <strong>
                      {deletionStatus.scheduled_for
                        ? new Date(deletionStatus.scheduled_for).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "the scheduled date"}
                    </strong>
                    .
                  </p>
                  {deletionStatus.days_remaining !== undefined && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      {deletionStatus.days_remaining} days remaining to cancel
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleCancelScheduledDeletion}
                disabled={cancellingDeletion}
                className="w-full"
              >
                {cancellingDeletion ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Scheduled Deletion"
                )}
              </Button>
            </div>
          ) : deletionStatus?.status === "pending" ? (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Deletion pending confirmation
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Please check your email to confirm or cancel the account deletion.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <DeleteAccountDialog
                trigger={
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
