/**
 * Organization API client
 *
 * Provides typed API calls for organization management endpoints.
 */

import { apiFetch } from "./client";

// Enums
export type OrganizationRole = "owner" | "admin" | "member";
export type SubscriptionTier = "free" | "professional" | "team" | "enterprise";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";
export type BillingCycle = "monthly" | "annual";
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

// Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  billing_cycle?: BillingCycle;
  seat_count: number;
  max_seats?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
  current_user_role?: OrganizationRole;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: OrganizationRole;
  is_active: boolean;
  joined_at: string;
  last_active_at?: string;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: OrganizationRole;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  invited_by_email?: string;
  organization_name?: string;
}

export interface OrganizationListResponse {
  items: Organization[];
  total: number;
  page: number;
  page_size: number;
}

export interface MemberListResponse {
  items: OrganizationMember[];
  total: number;
  page: number;
  page_size: number;
}

export interface InvitationListResponse {
  items: OrganizationInvitation[];
  total: number;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  billing_email?: string;
  billing_name?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateMemberRequest {
  role?: OrganizationRole;
  is_active?: boolean;
}

export interface CreateInvitationRequest {
  email: string;
  role?: OrganizationRole;
}

// API Functions

/**
 * List organizations the current user belongs to
 */
export async function listOrganizations(
  accessToken: string,
  page = 1,
  pageSize = 20
): Promise<OrganizationListResponse> {
  return apiFetch<OrganizationListResponse>(
    `/organizations?page=${page}&page_size=${pageSize}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}

/**
 * Get the current organization
 */
export async function getCurrentOrganization(
  accessToken: string,
  orgId?: string
): Promise<Organization> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  return apiFetch<Organization>("/organizations/current", {
    method: "GET",
    headers,
  });
}

/**
 * Create a new organization
 */
export async function createOrganization(
  accessToken: string,
  data: CreateOrganizationRequest
): Promise<Organization> {
  return apiFetch<Organization>("/organizations", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(data),
  });
}

/**
 * Update the current organization
 */
export async function updateOrganization(
  accessToken: string,
  data: UpdateOrganizationRequest,
  orgId?: string
): Promise<Organization> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  return apiFetch<Organization>("/organizations/current", {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
}

/**
 * Delete the current organization
 */
export async function deleteOrganization(
  accessToken: string,
  orgId?: string
): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  await apiFetch<void>("/organizations/current", {
    method: "DELETE",
    headers,
  });
}

// Member Management

/**
 * List members of the current organization
 */
export async function listMembers(
  accessToken: string,
  page = 1,
  pageSize = 20,
  orgId?: string
): Promise<MemberListResponse> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  return apiFetch<MemberListResponse>(
    `/organizations/current/members?page=${page}&page_size=${pageSize}`,
    {
      method: "GET",
      headers,
    }
  );
}

/**
 * Update a member's role or status
 */
export async function updateMember(
  accessToken: string,
  userId: string,
  data: UpdateMemberRequest,
  orgId?: string
): Promise<OrganizationMember> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  return apiFetch<OrganizationMember>(
    `/organizations/current/members/${userId}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    }
  );
}

/**
 * Remove a member from the organization
 */
export async function removeMember(
  accessToken: string,
  userId: string,
  orgId?: string
): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  await apiFetch<void>(`/organizations/current/members/${userId}`, {
    method: "DELETE",
    headers,
  });
}

/**
 * Leave the current organization
 */
export async function leaveOrganization(
  accessToken: string,
  orgId?: string
): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  await apiFetch<void>("/organizations/current/leave", {
    method: "POST",
    headers,
  });
}

// Invitation Management

/**
 * Create an invitation
 */
export async function createInvitation(
  accessToken: string,
  data: CreateInvitationRequest,
  orgId?: string
): Promise<OrganizationInvitation> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  return apiFetch<OrganizationInvitation>(
    "/organizations/current/invitations",
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  );
}

/**
 * List pending invitations
 */
export async function listInvitations(
  accessToken: string,
  orgId?: string
): Promise<InvitationListResponse> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  return apiFetch<InvitationListResponse>(
    "/organizations/current/invitations",
    {
      method: "GET",
      headers,
    }
  );
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(
  accessToken: string,
  invitationId: string,
  orgId?: string
): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  await apiFetch<void>(`/organizations/current/invitations/${invitationId}`, {
    method: "DELETE",
    headers,
  });
}

/**
 * Get invitation by token (public)
 */
export async function getInvitationByToken(
  token: string
): Promise<OrganizationInvitation> {
  return apiFetch<OrganizationInvitation>(`/organizations/invitations/${token}`, {
    method: "GET",
  });
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  accessToken: string,
  token: string
): Promise<Organization> {
  return apiFetch<Organization>(`/organizations/invitations/${token}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
