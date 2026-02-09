/**
 * Billing API client
 *
 * Provides authenticated API calls for billing endpoints.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

// =============================================================================
// Subscription API
// =============================================================================

/**
 * Fetch subscription data with authentication
 */
export async function fetchSubscription(): Promise<Response> {
  return fetch("/api/billing/subscription", {
    credentials: "same-origin",
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
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
}

/**
 * Cancel subscription (DELETE) with authentication
 */
export async function cancelSubscription(): Promise<Response> {
  return fetch("/api/billing/subscription", {
    method: "DELETE",
    credentials: "same-origin",
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
    credentials: "same-origin",
  });
}

/**
 * Fetch invoices with authentication
 */
export async function fetchInvoices(): Promise<Response> {
  return fetch("/api/billing/invoices", {
    credentials: "same-origin",
  });
}

/**
 * Fetch pricing tiers (no auth required)
 */
export async function fetchPricing(): Promise<Response> {
  return fetch("/api/billing/pricing", { credentials: "same-origin" });
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
      "Content-Type": "application/json",
    },
    credentials: "include",
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
