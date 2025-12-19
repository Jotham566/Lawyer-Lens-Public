"use client";

import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";

export type SubscriptionTier = "free" | "professional" | "team" | "enterprise";

// Feature flags interface matching backend tier configuration
export interface Features {
  basicSearch: boolean;
  aiChat: boolean;
  citations: boolean;
  deepResearch: boolean;
  contractDrafting: boolean;
  contractAnalysis: boolean;
  documentUpload: boolean;
  exportPdf: boolean;
  exportDocx: boolean;
  teamManagement: boolean;
  roleBasedAccess: boolean;
  sharedWorkspaces: boolean;
  activityLogs: boolean;
  ssoSaml: boolean;
  customIntegrations: boolean;
  apiAccess: boolean;
  dedicatedSupport: boolean;
}

export interface UsageData {
  display_name: string;
  current: number;
  limit: number | null;
  is_unlimited: boolean;
  remaining: number | null;
  percentage: number | null;
  is_at_limit: boolean;
}

export interface EntitlementsData {
  tier: SubscriptionTier;
  features: {
    [key: string]: boolean;
  };
  usage: {
    [key: string]: UsageData;
  };
  period_start: string;
  period_end: string;
}

export type RefreshOptions = {
  /** Force foreground loading state (used on auth changes) */
  forceLoading?: boolean;
  /** Clear existing entitlements before refetching (prevents stale flashes) */
  reset?: boolean;
};

export interface EntitlementsContextValue {
  entitlements: EntitlementsData | null;
  loading: boolean;
  isRefreshing: boolean; // True during background refresh (not initial load)
  /** True only after the first successful load completes - use this for UI that shouldn't flash */
  hasInitialized: boolean;
  error: string | null;
  refresh: (options?: RefreshOptions) => Promise<void>;
  hasFeature: (featureKey: string) => boolean;
  canUse: (usageKey: string, amount?: number) => boolean;
  getUsage: (usageKey: string) => UsageData | null;
  isAtLimit: (usageKey: string) => boolean;
  getUsagePercentage: (usageKey: string) => number;
}

const defaultContext: EntitlementsContextValue = {
  entitlements: null,
  loading: true,
  isRefreshing: false,
  hasInitialized: false,
  error: null,
  refresh: async () => {},
  hasFeature: () => false,
  canUse: () => false,
  getUsage: () => null,
  isAtLimit: () => true,
  getUsagePercentage: () => 0,
};

export const EntitlementsContext = createContext<EntitlementsContextValue>(defaultContext);

export function useEntitlements(): EntitlementsContextValue {
  return useContext(EntitlementsContext);
}

export function useEntitlementsProvider(): EntitlementsContextValue {
  const [entitlements, setEntitlements] = useState<EntitlementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track if this is the initial load - use ref to avoid callback recreation
  // Only show loading skeleton on initial load, not on refresh
  const isInitialLoadRef = useRef(true);
  // Track the current refresh version to ignore stale responses
  // This prevents race conditions when multiple refreshes are triggered
  const refreshVersionRef = useRef(0);
  // Track the AbortController for the current fetch
  const abortControllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async (options: RefreshOptions = {}) => {
    const { forceLoading = false, reset = false } = options;

    // Abort any in-flight request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Increment version and capture it for this request
    refreshVersionRef.current += 1;
    const thisVersion = refreshVersionRef.current;
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Allow callers to force a loading state (e.g., on auth changes) and optionally clear stale data
      if (reset) {
        setEntitlements(null);
        // CRITICAL: Reset the initialization flag when clearing data
        // This prevents GlobalUsageAlert from rendering with stale hasInitialized=true
        // while entitlements data is being refetched after an auth change
        setHasInitialized(false);
        // Also mark this as a fresh initial load so the flag gets set properly after fetch
        isInitialLoadRef.current = true;
      }

      if (isInitialLoadRef.current || forceLoading) {
        setLoading(true);
      } else {
        // Track background refresh separately for components like GlobalUsageAlert
        setIsRefreshing(true);
      }
      setError(null);

      // Get access token from localStorage (must match auth-provider.tsx key)
      const accessToken = typeof window !== "undefined"
        ? localStorage.getItem("auth_access_token")
        : null;

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/billing/entitlements", { 
        headers,
        signal: abortController.signal,
      });
      
      // Check if this request is still the latest one
      if (thisVersion !== refreshVersionRef.current) {
        // A newer request was started, ignore this response
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch entitlements");
      }

      const data = await response.json();
      
      // Double-check version again after parsing JSON
      if (thisVersion !== refreshVersionRef.current) {
        return;
      }
      
      setEntitlements(data);
    } catch (err) {
      // Ignore aborted requests - a newer request is in flight
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      // Check if this request is still the latest one
      if (thisVersion !== refreshVersionRef.current) {
        return;
      }
      
      setError(err instanceof Error ? err.message : "Unknown error");
      // Set default free tier entitlements on error (match API route defaults)
      setEntitlements({
        tier: "free",
        features: {},
        usage: {
          ai_query: {
            display_name: "AI Queries",
            current: 0,
            limit: 50,
            is_unlimited: false,
            remaining: 50,
            percentage: 0,
            is_at_limit: false,
          },
          deep_research: {
            display_name: "Deep Research",
            current: 0,
            limit: 0,
            is_unlimited: false,
            remaining: 0,
            percentage: 0,
            is_at_limit: true,
          },
          contract_draft: {
            display_name: "Contract Drafts",
            current: 0,
            limit: 0,
            is_unlimited: false,
            remaining: 0,
            percentage: 0,
            is_at_limit: true,
          },
          storage_gb: {
            display_name: "Storage (GB)",
            current: 0,
            limit: 1,
            is_unlimited: false,
            remaining: 1,
            percentage: 0,
            is_at_limit: false,
          },
        },
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
      });
    } finally {
      // Only update loading state if this is still the latest request
      if (thisVersion !== refreshVersionRef.current) {
        return;
      }
      
      setLoading(false);
      setIsRefreshing(false);
      // Mark as initialized after first successful load (even if it failed with fallback data)
      if (isInitialLoadRef.current) {
        // Delay setting hasInitialized to ensure React has finished state updates
        setTimeout(() => {
          // Final check before setting initialized - ensure no newer request started
          if (thisVersion === refreshVersionRef.current) {
            setHasInitialized(true);
          }
        }, 50);
      }
      isInitialLoadRef.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasFeature = useCallback(
    (featureKey: string): boolean => {
      if (!entitlements) return false;
      return entitlements.features[featureKey] ?? false;
    },
    [entitlements]
  );

  const canUse = useCallback(
    (usageKey: string, amount: number = 1): boolean => {
      if (!entitlements) return false;
      const usage = entitlements.usage[usageKey];
      if (!usage) return false;
      if (usage.is_unlimited) return true;
      return (usage.remaining ?? 0) >= amount;
    },
    [entitlements]
  );

  const getUsage = useCallback(
    (usageKey: string): UsageData | null => {
      if (!entitlements) return null;
      return entitlements.usage[usageKey] ?? null;
    },
    [entitlements]
  );

  const isAtLimit = useCallback(
    (usageKey: string): boolean => {
      if (!entitlements) return true;
      const usage = entitlements.usage[usageKey];
      if (!usage) return true;
      return usage.is_at_limit;
    },
    [entitlements]
  );

  const getUsagePercentage = useCallback(
    (usageKey: string): number => {
      if (!entitlements) return 0;
      const usage = entitlements.usage[usageKey];
      if (!usage) return 0;
      return usage.percentage ?? 0;
    },
    [entitlements]
  );

  return {
    entitlements,
    loading,
    isRefreshing,
    error,
    refresh,
    hasFeature,
    canUse,
    getUsage,
    isAtLimit,
    getUsagePercentage,
    hasInitialized,
  };
}

// Feature keys for type safety
export const FEATURES = {
  DEEP_RESEARCH: "deep_research",
  CONTRACT_DRAFTING: "contract_drafting",
  CONTRACT_ANALYSIS: "contract_analysis",
  API_ACCESS: "api_access",
  PRIORITY_SUPPORT: "priority_support",
  CUSTOM_INTEGRATIONS: "custom_integrations",
  TEAM_MEMBERS: "team_members",
} as const;

// Usage keys for type safety
export const USAGE_TYPES = {
  AI_QUERY: "ai_query",
  DEEP_RESEARCH: "deep_research",
  CONTRACT_DRAFT: "contract_draft",
  CONTRACT_ANALYSIS: "contract_analysis",
  STORAGE_GB: "storage_gb",
  API_CALL: "api_call",
} as const;

// Helper to get tier display name
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: "Free",
    professional: "Professional",
    team: "Team",
    enterprise: "Enterprise",
  };
  return names[tier] || tier;
}

// Helper to check if tier is at least a certain level
export function isTierAtLeast(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierOrder: SubscriptionTier[] = ["free", "professional", "team", "enterprise"];
  const currentIndex = tierOrder.indexOf(currentTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  return currentIndex >= requiredIndex;
}
