"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Monitor,
  Smartphone,
  Trash2,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { PageHeader, AlertBanner, PageLoading } from "@/components/common";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth, useRequireAuth } from "@/components/providers";
import {
  changePassword,
  getSessions,
  revokeSession,
  revokeAllSessions,
  type UserSession,
} from "@/lib/api/auth";
import { APIError } from "@/lib/api/client";

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
  ];

  return (
    <div className="space-y-1 mt-2">
      {checks.map((check) => (
        <div
          key={check.label}
          className={`flex items-center gap-2 text-xs ${
            check.valid
              ? "text-green-600 dark:text-green-400"
              : "text-muted-foreground"
          }`}
        >
          {check.valid ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <div className="h-3 w-3 rounded-full border" />
          )}
          {check.label}
        </div>
      ))}
    </div>
  );
}

function getDeviceIcon(deviceInfo?: { device?: string }) {
  if (deviceInfo?.device?.toLowerCase().includes("mobile")) {
    return <Smartphone className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
}

function formatSessionInfo(session: UserSession): string {
  const parts: string[] = [];

  if (session.device_info?.browser) {
    parts.push(session.device_info.browser);
  }
  if (session.device_info?.os) {
    parts.push(`on ${session.device_info.os}`);
  }

  return parts.length > 0 ? parts.join(" ") : session.user_agent || "Unknown device";
}

export default function SecuritySettingsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { user, accessToken } = useAuth();

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch("new_password", "");

  // Load sessions
  useEffect(() => {
    async function loadSessions() {
      if (!accessToken) return;

      try {
        const data = await getSessions(accessToken);
        setSessions(data);
      } catch (err) {
        setSessionError("Failed to load sessions");
      } finally {
        setLoadingSessions(false);
      }
    }

    if (accessToken) {
      loadSessions();
    }
  }, [accessToken]);

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!accessToken) return;

    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await changePassword(accessToken, {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      setPasswordSuccess("Password changed successfully");
      reset();
    } catch (err) {
      if (err instanceof APIError) {
        if (err.errorCode === "INVALID_CREDENTIALS") {
          setPasswordError("Current password is incorrect");
        } else {
          setPasswordError(err.message || "Failed to change password");
        }
      } else {
        setPasswordError("An unexpected error occurred");
      }
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!accessToken) return;

    setRevokingSession(sessionId);
    setSessionError(null);

    try {
      await revokeSession(accessToken, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      if (err instanceof APIError) {
        setSessionError(err.message || "Failed to revoke session");
      } else {
        setSessionError("An unexpected error occurred");
      }
    } finally {
      setRevokingSession(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!accessToken) return;

    setRevokingAll(true);
    setSessionError(null);

    try {
      await revokeAllSessions(accessToken);
      setSessions((prev) => prev.filter((s) => s.is_current));
    } catch (err) {
      if (err instanceof APIError) {
        setSessionError(err.message || "Failed to revoke sessions");
      } else {
        setSessionError("An unexpected error occurred");
      }
    } finally {
      setRevokingAll(false);
    }
  };

  if (authLoading || !user) {
    return <PageLoading message="Loading security settings..." />;
  }

  // Only show password change for email auth
  const canChangePassword = user.auth_provider === "email";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Settings"
        description="Manage your password and active sessions"
      />

      {/* Change Password */}
      {canChangePassword && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              {passwordError && (
                <AlertBanner
                  variant="error"
                  message={passwordError}
                  onDismiss={() => setPasswordError(null)}
                />
              )}

              {passwordSuccess && (
                <AlertBanner
                  variant="success"
                  message={passwordSuccess}
                  onDismiss={() => setPasswordSuccess(null)}
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    {...register("current_password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.current_password && (
                  <p className="text-sm text-destructive">
                    {errors.current_password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    {...register("new_password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.new_password && (
                  <p className="text-sm text-destructive">
                    {errors.new_password.message}
                  </p>
                )}
                <PasswordStrength password={newPassword} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    {...register("confirm_password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-destructive">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing password...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage devices where you&apos;re signed in
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={revokingAll}>
                    {revokingAll ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Sign out all other devices
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out all other devices?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will end all sessions except your current one. You&apos;ll
                      need to sign in again on those devices.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevokeAll}>
                      Sign out all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessionError && (
            <AlertBanner
              variant="error"
              message={sessionError}
              onDismiss={() => setSessionError(null)}
              className="mb-4"
            />
          )}

          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No active sessions found
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-muted-foreground">
                      {getDeviceIcon(session.device_info)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {formatSessionInfo(session)}
                        </span>
                        {session.is_current && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {session.ip_address && (
                          <span className="mr-3">{session.ip_address}</span>
                        )}
                        {session.last_activity_at && (
                          <span>
                            Last active{" "}
                            {new Date(session.last_activity_at).toLocaleDateString(
                              "en-UG",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!session.is_current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingSession === session.id}
                    >
                      {revokingSession === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
