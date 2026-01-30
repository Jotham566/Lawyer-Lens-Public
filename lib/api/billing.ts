/**
 * Billing API client
 *
 * Provides authenticated API calls for billing endpoints.
 * Uses the same token storage as auth-provider.tsx.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

// Token storage key - must match auth-provider.tsx
const ACCESS_TOKEN_KEY = "auth_access_token";

/**
 * Get auth headers for billing API calls
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  if (typeof window !== "undefined") {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return headers;
}

// =============================================================================
// Subscription API
// =============================================================================

/**
 * Fetch subscription data with authentication
 */
export async function fetchSubscription(): Promise<Response> {
  return fetch("/api/billing/subscription", {
    headers: getAuthHeaders(),
  });
}

/**
 * Update subscription (PATCH) with authentication
 */
export async function updateSubscription(
  body: Record<string, unknown>
): Promise<Response> {
  return fetch("/api/billing/subscription", {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/**
 * Cancel subscription (DELETE) with authentication
 */
export async function cancelSubscription(): Promise<Response> {
  return fetch("/api/billing/subscription", {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

// =============================================================================
// Usage & Invoices API
// =============================================================================

/**
 * Fetch usage data with authentication
 */
export async function fetchUsage(): Promise<Response> {
  return fetch("/api/billing/usage", {
    headers: getAuthHeaders(),
  });
}

/**
 * Fetch invoices with authentication
 */
export async function fetchInvoices(): Promise<Response> {
  return fetch("/api/billing/invoices", {
    headers: getAuthHeaders(),
  });
}

/**
 * Fetch pricing tiers (no auth required)
 */
export async function fetchPricing(): Promise<Response> {
  return fetch("/api/billing/pricing");
}

// =============================================================================
// Activity History API
// =============================================================================

export interface ActivityRecord {
  id: string;
  usage_type: string;
  quantity: number;
  recorded_at: string;
  user_id?: string;
  extra_data?: Record<string, unknown>;
}

export interface UsageHistory {
  items: ActivityRecord[];
  total: number;
}

/**
 * Get activity history for the organization.
 */
export async function getActivityHistory(
  accessToken: string,
  options: {
    usageType?: string;
    days?: number;
  } = {}
): Promise<ActivityRecord[]> {
  const params = new URLSearchParams();
  if (options.usageType) {
    params.set("usage_type", options.usageType);
  }
  if (options.days) {
    params.set("days", options.days.toString());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/billing/usage/history${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity history: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Format usage type for display.
 */
export function formatUsageType(usageType: string): string {
  const labels: Record<string, string> = {
    ai_query: "AI Query",
    deep_research: "Deep Research",
    contract_draft: "Contract Draft",
    contract_analysis: "Contract Analysis",
    storage_gb: "Storage",
    api_call: "API Call",
  };
  return labels[usageType] || usageType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get icon name for usage type.
 */
export function getUsageTypeIcon(usageType: string): string {
  const icons: Record<string, string> = {
    ai_query: "MessageSquare",
    deep_research: "Search",
    contract_draft: "FileText",
    contract_analysis: "FileText",
    storage_gb: "HardDrive",
    api_call: "Zap",
  };
  return icons[usageType] || "Activity";
}
