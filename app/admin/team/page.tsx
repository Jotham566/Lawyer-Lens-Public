"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  UserMinus,
  Crown,
  Mail,
  Search,
  Upload,
  UserX,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useRequireAuth } from "@/components/providers";
import {
  getCurrentOrganization,
  listMembers,
  updateMember,
  removeMember,
  createInvitation,
  listInvitations,
  type Organization,
  type OrganizationMember,
  type OrganizationRole,
  type OrganizationInvitation,
} from "@/lib/api/organizations";
import { FeatureGate } from "@/components/entitlements/feature-gate";
import { AlertBanner, RoleBadge } from "@/components/common";
import { formatDateOnly } from "@/lib/utils/date-formatter";

function TeamManagementContent() {
  const { isAuthenticated, user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false);
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);
  const [memberToSuspend, setMemberToSuspend] = useState<OrganizationMember | null>(null);

  // Bulk invite state
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkRole, setBulkRole] = useState<OrganizationRole>("member");
  const [bulkInviting, setBulkInviting] = useState(false);

  // Transfer ownership
  const [newOwnerId, setNewOwnerId] = useState("");
  const [transferring, setTransferring] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated) return;

      try {
        const [org, membersData, invitationsData] = await Promise.all([
          getCurrentOrganization(),
          listMembers(),
          listInvitations(),
        ]);
        setOrganization(org);
        setMembers(membersData.items);
        setInvitations(invitationsData.items);
      } catch {
        setError("Failed to load team data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated]);

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && member.is_active) ||
      (statusFilter === "suspended" && !member.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = async (member: OrganizationMember, newRole: OrganizationRole) => {
    if (!isAuthenticated) return;
    setActionLoading(member.id);
    setError(null);

    try {
      await updateMember(member.user_id, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
      );
      setSuccess(`Changed ${member.full_name || member.email}'s role to ${newRole}`);
    } catch {
      setError("Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async () => {
    if (!isAuthenticated || !memberToSuspend) return;
    setActionLoading(memberToSuspend.id);
    setError(null);

    try {
      const newStatus = !memberToSuspend.is_active;
      await updateMember(memberToSuspend.user_id, { is_active: newStatus });
      setMembers((prev) =>
        prev.map((m) => (m.id === memberToSuspend.id ? { ...m, is_active: newStatus } : m))
      );
      setSuccess(
        newStatus
          ? `Reactivated ${memberToSuspend.full_name || memberToSuspend.email}`
          : `Suspended ${memberToSuspend.full_name || memberToSuspend.email}`
      );
    } catch {
      setError("Failed to update member status");
    } finally {
      setActionLoading(null);
      setMemberToSuspend(null);
    }
  };

  const handleRemove = async () => {
    if (!isAuthenticated || !memberToRemove) return;
    setActionLoading(memberToRemove.id);
    setError(null);

    try {
      await removeMember(memberToRemove.user_id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      setSuccess(`Removed ${memberToRemove.full_name || memberToRemove.email} from the team`);
    } catch {
      setError("Failed to remove member");
    } finally {
      setActionLoading(null);
      setMemberToRemove(null);
    }
  };

  const handleBulkInvite = async () => {
    if (!isAuthenticated) return;
    setBulkInviting(true);
    setError(null);

    const emails = bulkEmails
      .split(/[\n,;]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    if (emails.length === 0) {
      setError("No valid email addresses found");
      setBulkInviting(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const email of emails) {
      try {
        await createInvitation({ email, role: bulkRole });
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      // Refresh invitations
      const invitationsData = await listInvitations();
      setInvitations(invitationsData.items);
      setSuccess(
        `Sent ${successCount} invitation${successCount > 1 ? "s" : ""}${
          failCount > 0 ? ` (${failCount} failed)` : ""
        }`
      );
    } else {
      setError("Failed to send invitations");
    }

    setBulkEmails("");
    setBulkInviting(false);
    setBulkInviteOpen(false);
  };

  const handleTransferOwnership = async () => {
    if (!isAuthenticated || !newOwnerId) return;
    setTransferring(true);
    setError(null);

    try {
      // This would call a transfer ownership API endpoint
      // For now, we'll change the roles
      const newOwner = members.find((m) => m.user_id === newOwnerId);
      if (!newOwner) throw new Error("Member not found");

      // Change current owner to admin
      const currentOwner = members.find((m) => m.role === "owner");
      if (currentOwner) {
        await updateMember(currentOwner.user_id, { role: "admin" });
      }

      // Change new owner
      await updateMember(newOwnerId, { role: "owner" });

      // Refresh members
      const membersData = await listMembers();
      setMembers(membersData.items);

      setSuccess(`Transferred ownership to ${newOwner.full_name || newOwner.email}`);
      setTransferOwnershipOpen(false);
      setNewOwnerId("");
    } catch {
      setError("Failed to transfer ownership");
    } finally {
      setTransferring(false);
    }
  };

  const isOwner = organization?.current_user_role === "owner";
  const isAdmin = organization?.current_user_role === "admin" || isOwner;

  if (loading) {
    return (
      <div className="container max-w-6xl py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-6xl py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be an admin or owner to manage team members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin">Back to Admin Console</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeCount = members.filter((m) => m.is_active).length;
  const suspendedCount = members.filter((m) => !m.is_active).length;
  const pendingCount = invitations.filter((i) => i.status === "pending").length;

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage members, roles, and invitations for {organization?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBulkInviteOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Invite
          </Button>
          <Button asChild>
            <Link href="/settings/organization/invitations">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AlertBanner variant="success" message={success} onDismiss={() => setSuccess(null)} />}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-orange-600">{suspendedCount}</p>
              </div>
              <UserX className="h-8 w-8 text-orange-600/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const isCurrentUser = member.user_id === user?.id;
                const isMemberOwner = member.role === "owner";

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {member.full_name?.charAt(0) || member.email.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.full_name || "—"}
                            {isCurrentUser && (
                              <span className="text-muted-foreground ml-2">(you)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={member.role} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateOnly(member.joined_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.last_active_at
                        ? formatDateOnly(member.last_active_at)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isCurrentUser || actionLoading === member.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!isMemberOwner && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member, "admin")}
                                disabled={member.role === "admin"}
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(member, "member")}
                                disabled={member.role === "member"}
                              >
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Make Member
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {!isMemberOwner && (
                            <DropdownMenuItem onClick={() => setMemberToSuspend(member)}>
                              {member.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Reactivate
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {isOwner && !isMemberOwner && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setNewOwnerId(member.user_id);
                                  setTransferOwnershipOpen(true);
                                }}
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Transfer Ownership
                              </DropdownMenuItem>
                            </>
                          )}
                          {!isMemberOwner && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setMemberToRemove(member)}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove from Team
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk Invite Dialog */}
      <Dialog open={bulkInviteOpen} onOpenChange={setBulkInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Invite Members</DialogTitle>
            <DialogDescription>
              Enter email addresses separated by commas, semicolons, or new lines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                placeholder="user1@example.com, user2@example.com&#10;user3@example.com"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={bulkRole} onValueChange={(v) => setBulkRole(v as OrganizationRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkInvite} disabled={bulkInviting || !bulkEmails.trim()}>
              {bulkInviting ? "Sending..." : "Send Invitations"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <AlertDialog open={transferOwnershipOpen} onOpenChange={setTransferOwnershipOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Ownership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer ownership to{" "}
              <strong>
                {members.find((m) => m.user_id === newOwnerId)?.full_name ||
                  members.find((m) => m.user_id === newOwnerId)?.email}
              </strong>
              ? You will become an admin and cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTransferOwnership} disabled={transferring}>
              {transferring ? "Transferring..." : "Transfer Ownership"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend/Reactivate Dialog */}
      <AlertDialog open={!!memberToSuspend} onOpenChange={() => setMemberToSuspend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberToSuspend?.is_active ? "Suspend Member" : "Reactivate Member"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {memberToSuspend?.is_active
                ? `Are you sure you want to suspend ${memberToSuspend?.full_name || memberToSuspend?.email}? They will lose access to the organization until reactivated.`
                : `Are you sure you want to reactivate ${memberToSuspend?.full_name || memberToSuspend?.email}? They will regain access to the organization.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend}>
              {memberToSuspend?.is_active ? "Suspend" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{memberToRemove?.full_name || memberToRemove?.email}</strong> from the team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
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

export default function TeamManagementPage() {
  useRequireAuth();

  return (
    <FeatureGate
      feature="team_management"
      fallback={
        <div className="container max-w-6xl py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Team management is available on Team and Enterprise plans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/pricing">Upgrade Plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <TeamManagementContent />
    </FeatureGate>
  );
}
