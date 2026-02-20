"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  Loader2,
  Building2,
  Users,
  Mail,
  Shield,
  ChevronRight,
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth, useRequireAuth } from "@/components/providers";
import {
  getCurrentOrganization,
  updateOrganization,
  type Organization,
} from "@/lib/api/organizations";
import { getUserFriendlyError } from "@/lib/api/client";
import {
  PageHeader,
  AlertBanner,
  PageLoading,
  EmptyState,
  RoleBadge,
  TierBadge,
} from "@/components/common";
import { FeatureGate } from "@/components/entitlements/feature-gate";

const orgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  description: z.string().max(500).optional(),
});

type OrgFormData = z.infer<typeof orgSchema>;

function OrganizationSettingsContent() {
  const { isLoading: authLoading } = useRequireAuth();
  const { isAuthenticated } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
  });

  // Load organization
  useEffect(() => {
    async function loadOrganization() {
      if (!isAuthenticated) return;

      try {
        const org = await getCurrentOrganization();
        setOrganization(org);
        reset({
          name: org.name,
          description: org.description || "",
        });
      } catch (err) {
        console.error("Failed to load organization:", err);
        setError("Failed to load organization");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadOrganization();
    }
  }, [isAuthenticated, reset]);

  const onSubmit = async (data: OrgFormData) => {
    if (!isAuthenticated) return;

    setError(null);
    setSuccess(null);

    try {
      const updated = await updateOrganization({
        name: data.name,
        description: data.description || undefined,
      });
      setOrganization(updated);
      setSuccess("Organization updated successfully");
    } catch (err) {
      setError(getUserFriendlyError(err, "Failed to update organization"));
    }
  };

  if (authLoading || loading) {
    return <PageLoading message="Loading organization settings..." />;
  }

  if (!organization) {
    return (
      <EmptyState
        icon={Building2}
        title="No Organization"
        description="You don't belong to any organization yet."
      />
    );
  }

  const canEdit = organization.current_user_role === "owner" || organization.current_user_role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Manage your organization details and settings"
      />

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

      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organization Overview</CardTitle>
              <CardDescription>Your organization at a glance</CardDescription>
            </div>
            <TierBadge tier={organization.subscription_tier as "free" | "professional" | "team" | "enterprise"} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{organization.member_count || organization.seat_count}</p>
                <p className="text-xs text-muted-foreground">
                  {organization.max_seats ? `of ${organization.max_seats} seats` : "Members"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{organization.slug}</p>
                <p className="text-xs text-muted-foreground">Organization ID</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium capitalize">{organization.subscription_status}</p>
                <p className="text-xs text-muted-foreground">Subscription Status</p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Your Role</p>
              <p className="text-xs text-muted-foreground">
                Your permissions in this organization
              </p>
            </div>
            {organization.current_user_role && (
              <RoleBadge role={organization.current_user_role as "owner" | "admin" | "member"} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>Manage your team members and invitations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Link
            href="/settings/organization/members"
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Team Members</p>
                <p className="text-sm text-muted-foreground">
                  View and manage team members
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link
            href="/settings/organization/invitations"
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Pending Invitations</p>
                <p className="text-sm text-muted-foreground">
                  Manage team invitations
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {/* Organization Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            {canEdit
              ? "Update your organization information"
              : "View your organization information (admin access required to edit)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  className="pl-10"
                  disabled={!canEdit}
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your organization"
                disabled={!canEdit}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {canEdit && (
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
                    onClick={() =>
                      reset({
                        name: organization.name,
                        description: organization.description || "",
                      })
                    }
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrganizationSettingsPage() {
  return (
    <FeatureGate
      feature="team_management"
      requiredTier="team"
      featureName="Organization Management"
    >
      <OrganizationSettingsContent />
    </FeatureGate>
  );
}
