"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Clock,
  X,
  UserPlus,
  Shield,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth, useRequireAuth } from "@/components/providers";
import {
  getCurrentOrganization,
  listInvitations,
  createInvitation,
  cancelInvitation,
  type Organization,
  type OrganizationInvitation,
  type OrganizationRole,
} from "@/lib/api/organizations";
import { APIError } from "@/lib/api/client";

// Import reusable components
import {
  PageHeader,
  AlertBanner,
  PageLoading,
  EmptyState,
  InlineLoading,
} from "@/components/common";
import { FeatureGate } from "@/components/entitlements/feature-gate";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin"] as const),
});

type InviteFormData = z.infer<typeof inviteSchema>;

function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return "Less than 1h remaining";
}

function InvitationsContent() {
  const { isLoading: authLoading } = useRequireAuth();
  const { accessToken } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "member",
    },
  });

  const selectedRole = watch("role");

  // Load organization and invitations
  useEffect(() => {
    async function loadData() {
      if (!accessToken) return;

      try {
        const [org, invitationsData] = await Promise.all([
          getCurrentOrganization(accessToken),
          listInvitations(accessToken),
        ]);
        setOrganization(org);
        setInvitations(invitationsData.items);
      } catch {
        setError("Failed to load invitations");
      } finally {
        setLoading(false);
      }
    }

    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  const onSubmitInvite = async (data: InviteFormData) => {
    if (!accessToken) return;

    setError(null);
    setSuccess(null);

    try {
      const invitation = await createInvitation(accessToken, {
        email: data.email,
        role: data.role as OrganizationRole,
      });
      setInvitations((prev) => [invitation, ...prev]);
      setSuccess(`Invitation sent to ${data.email}`);
      reset();
      setDialogOpen(false);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Failed to send invitation");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleCancelInvitation = async (invitation: OrganizationInvitation) => {
    if (!accessToken) return;

    setCancellingId(invitation.id);
    setError(null);
    setSuccess(null);

    try {
      await cancelInvitation(accessToken, invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      setSuccess(`Invitation to ${invitation.email} has been cancelled`);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Failed to cancel invitation");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setCancellingId(null);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return <PageLoading message="Loading invitations..." />;
  }

  const canInvite =
    organization?.current_user_role === "owner" ||
    organization?.current_user_role === "admin";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Team Invitations"
        description="Invite new members to your organization"
        backHref="/settings/organization"
        backLabel="Back to organization"
        actions={
          canInvite ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join {organization?.name}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmitInvite)}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="colleague@example.com"
                          className="pl-10"
                          {...register("email")}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={selectedRole}
                        onValueChange={(value) => setValue("role", value as "member" | "admin")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div>
                                <p className="font-medium">Member</p>
                                <p className="text-xs text-muted-foreground">
                                  Can access all features
                                </p>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              <div>
                                <p className="font-medium">Admin</p>
                                <p className="text-xs text-muted-foreground">
                                  Can manage team and settings
                                </p>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <InlineLoading className="mr-2" />
                          Sending...
                        </>
                      ) : (
                        "Send Invitation"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {/* Feedback Messages */}
      {error && (
        <AlertBanner
          variant="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {success && (
        <AlertBanner
          variant="success"
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations ({invitations.length})
          </CardTitle>
          <CardDescription>
            Invitations that have been sent but not yet accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No pending invitations"
              description="Invite team members to get started"
              action={
                canInvite
                  ? {
                      label: "Invite Member",
                      onClick: () => setDialogOpen(true),
                    }
                  : undefined
              }
              compact
            />
          ) : (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {/* Invitation Info */}
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeRemaining(invitation.expires_at)}</span>
                        {invitation.invited_by_email && (
                          <>
                            <span>•</span>
                            <span>Invited by {invitation.invited_by_email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    <Badge variant="secondary" className="capitalize">
                      {invitation.role}
                    </Badge>
                    {/* Cancel Button */}
                    {canInvite && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelInvitation(invitation)}
                        disabled={cancellingId === invitation.id}
                        aria-label={`Cancel invitation for ${invitation.email}`}
                      >
                        {cancellingId === invitation.id ? (
                          <InlineLoading />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Link to Members */}
      <div className="flex justify-center">
        <Button variant="ghost" asChild>
          <Link href="/settings/organization/members">
            View current team members
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function InvitationsPage() {
  return (
    <FeatureGate
      feature="team_management"
      requiredTier="team"
      featureName="Team Management"
    >
      <InvitationsContent />
    </FeatureGate>
  );
}
