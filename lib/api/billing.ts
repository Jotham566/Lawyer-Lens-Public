/**
 * Billing API client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

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
