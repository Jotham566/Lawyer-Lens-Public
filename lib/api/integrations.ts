/**
 * Integrations API client.
 *
 * Enterprise feature: API key management for organization integrations.
 */

import { apiFetch, apiGet, apiPost } from "./client";

// =============================================================================
// Types
// =============================================================================

export interface APIKeyScope {
  scope: string;
  description: string;
  category: string;
}

export interface APIKey {
  id: string;
  name: string;
  description: string | null;
  key_prefix: string;
  scopes: string[];
  rate_limit_per_minute: number;
  daily_limit: number | null;
  requests_today: number;
  total_requests: number;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  created_by_email: string | null;
}

export interface APIKeyCreateRequest {
  name: string;
  description?: string;
  scopes: string[];
  rate_limit_per_minute?: number;
  daily_limit?: number;
  expires_in_days?: number;
}

export interface APIKeyCreateResponse {
  id: string;
  name: string;
  key_prefix: string;
  full_key: string;
  scopes: string[];
  rate_limit_per_minute: number;
  daily_limit: number | null;
  expires_at: string | null;
  created_at: string;
  message: string;
}

export interface APIKeyListResponse {
  items: APIKey[];
  total: number;
}

export interface AvailableScopesResponse {
  scopes: APIKeyScope[];
}

export interface UsageStats {
  key_id: string;
  key_name: string;
  total_requests: number;
  requests_today: number;
  last_used_at: string | null;
  daily_stats: Array<{ date: string; count: number }>;
  endpoint_breakdown: Array<{ endpoint: string; count: number }>;
  avg_response_time_ms: number | null;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get available API key scopes.
 */
export async function getAvailableScopes(): Promise<AvailableScopesResponse> {
  return apiGet<AvailableScopesResponse>("/integrations/api-keys/scopes");
}

/**
 * List API keys for the organization.
 */
export async function listAPIKeys(
  includeRevoked: boolean = false
): Promise<APIKeyListResponse> {
  return apiGet<APIKeyListResponse>("/integrations/api-keys", {
    include_revoked: includeRevoked,
  });
}

/**
 * Create a new API key.
 *
 * WARNING: The full_key is only returned once and must be saved immediately.
 */
export async function createAPIKey(
  data: APIKeyCreateRequest
): Promise<APIKeyCreateResponse> {
  return apiPost<APIKeyCreateResponse, APIKeyCreateRequest>(
    "/integrations/api-keys",
    data
  );
}

/**
 * Revoke an API key.
 */
export async function revokeAPIKey(
  keyId: string,
  reason?: string
): Promise<void> {
  const params = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  await apiFetch<void>(`/integrations/api-keys/${keyId}${params}`, {
    method: "DELETE",
  });
}

/**
 * Get usage statistics for an API key.
 */
export async function getAPIKeyUsage(
  keyId: string,
  days: number = 30
): Promise<UsageStats> {
  return apiGet<UsageStats>(`/integrations/api-keys/${keyId}/usage`, { days });
}
