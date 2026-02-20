"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  MoreHorizontal,
  UserMinus,
  ShieldCheck,
  ShieldOff,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useAuth, useRequireAuth } from "@/components/providers";
import {
  getCurrentOrganization,
  listMembers,
  updateMember,
  removeMember,
  type Organization,
  type OrganizationMember,
  type OrganizationRole,
} from "@/lib/api/organizations";
import { APIError, getUserFriendlyError } from "@/lib/api/client";

// Import reusable components
import {
  PageHeader,
  AlertBanner,
  PageLoading,
  EmptyState,
  RoleBadge,
  InlineLoading,
} from "@/components/common";
import { FeatureGate } from "@/components/entitlements/feature-gate";

function TeamMembersContent() {
  const { isLoading: authLoading } = useRequireAuth();
  const { user, isAuthenticated } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load organization and members
  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated) return;

      try {
        const [org, membersData] = await Promise.all([
          getCurrentOrganization(),
          listMembers(),
        ]);
        setOrganization(org);
        setMembers(membersData.items);
      } catch {
        setError("Failed to load team members");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleRoleChange = async (member: OrganizationMember, newRole: OrganizationRole) => {
    if (!isAuthenticated) return;

    setActionLoading(member.id);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateMember(member.user_id, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: updated.role } : m))
      );
      setSuccess(`${member.full_name}'s role updated to ${newRole}`);
    } catch (err) {
      setError(getUserFriendlyError(err, "Failed to update member role"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!isAuthenticated || !memberToRemove) return;

    setActionLoading(memberToRemove.id);
    setError(null);
    setSuccess(null);

    try {
      await removeMember(memberToRemove.user_id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      setSuccess(`${memberToRemove.full_name} has been removed from the team`);
    } catch (err) {
      setError(getUserFriendlyError(err, "Failed to remove member"));
    } finally {
      setActionLoading(null);
      setMemberToRemove(null);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return <PageLoading message="Loading team members..." />;
  }

  const canManageMembers =
    organization?.current_user_role === "owner" ||
    organization?.current_user_role === "admin";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Team Members"
        description="Manage your organization's team members"
        backHref="/settings/organization"
        backLabel="Back to organization"
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

      {/* Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members ({members.length})
              </CardTitle>
              <CardDescription>
                People who have access to this organization
              </CardDescription>
            </div>
            {canManageMembers && (
              <Button asChild>
                <Link href="/settings/organization/invitations">Invite Members</Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No team members found"
              description="Invite team members to collaborate on legal research"
              action={
                canManageMembers
                  ? {
                      label: "Invite Members",
                      href: "/settings/organization/invitations",
                    }
                  : undefined
              }
              compact
            />
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const isCurrentUser = member.user_id === user?.id;
                const canModify = canManageMembers && !isCurrentUser && member.role !== "owner";

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {member.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      {/* Member Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.full_name}</p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Role Badge */}
                      <RoleBadge role={member.role} />

                      {/* Actions Dropdown */}
                      {canModify && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={actionLoading === member.id}
                              aria-label={`Actions for ${member.full_name}`}
                            >
                              {actionLoading === member.id ? (
                                <InlineLoading />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.role !== "admin" && (
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member, "admin")}
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {member.role === "admin" && (
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member, "member")}
                              >
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Remove Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setMemberToRemove(member)}
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">{memberToRemove?.full_name}</span> from the
              team? They will lose access to this organization immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TeamMembersPage() {
  return (
    <FeatureGate
      feature="team_management"
      requiredTier="team"
      featureName="Team Management"
    >
      <TeamMembersContent />
    </FeatureGate>
  );
}
