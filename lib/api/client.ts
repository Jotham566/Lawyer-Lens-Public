/**
 * API Client for Law Lens Public Portal
 *
 * Provides typed API calls to the backend services.
 * Compatible with backend APIError format (error_code, message, details, trace_id).
 */

// API Base URL configuration
// - NEXT_PUBLIC_API_URL: Used for client-side (browser) requests (baked in at build time)
// - INTERNAL_API_URL: Used for server-side requests in Docker (runtime env var)
const getApiBase = () => {
  // Server-side: use INTERNAL_API_URL if available (for Docker networking)
  if (typeof window === "undefined" && process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }
  // Client-side or fallback: use NEXT_PUBLIC_API_URL or default
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
};

const API_BASE = getApiBase();

const CSRF_COOKIE_NAME = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || "csrf_token";

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken(): string | null {
  return getCookieValue(CSRF_COOKIE_NAME);
}

function requiresCsrf(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

// ============================================================================
// 401 Event Handling for Auto-Logout
// ============================================================================

type UnauthorizedHandler = () => void;
let unauthorizedHandlers: UnauthorizedHandler[] = [];

/**
 * Subscribe to 401 unauthorized events.
 * Used by auth provider to handle automatic logout.
 * @returns Unsubscribe function
 */
export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.push(handler);
  return () => {
    unauthorizedHandlers = unauthorizedHandlers.filter((h) => h !== handler);
  };
}

/**
 * Emit 401 unauthorized event to all subscribers
 */
function emitUnauthorized(): void {
  unauthorizedHandlers.forEach((handler) => {
    try {
      handler();
    } catch (e) {
      console.error("Error in unauthorized handler:", e);
    }
  });
}

/**
 * Backend APIError response format
 */
export interface BackendAPIError {
  error_code: string;
  message: string;
  details?: Record<string, unknown> | null;
  trace_id?: string | null;
}

/**
 * Feature gating error details from backend
 */
export interface FeatureGatingDetails {
  error: "feature_not_available";
  message: string;
  feature: string;
  tier: string;
  required_tier: string;
}

/**
 * Feature display names for user-friendly messages
 */
const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  deep_research: "Deep Research",
  contract_drafting: "Contract Drafting",
  contract_analysis: "Contract Analysis",
  document_upload: "Document Upload",
  export_pdf: "PDF Export",
  export_docx: "Word Export",
  team_management: "Team Management",
  sso_saml: "Single Sign-On (SSO)",
  custom_integrations: "Custom Integrations",
  api_access: "API Access",
  audit_logs: "Audit Logs",
};

/**
 * Tier display names
 */
const TIER_DISPLAY_NAMES: Record<string, string> = {
  free: "Free",
  professional: "Professional",
  team: "Team",
  enterprise: "Enterprise",
};

/**
 * Get display name for a feature
 */
export function getFeatureDisplayName(feature: string | undefined | null): string {
  if (!feature) return "This Feature";
  return FEATURE_DISPLAY_NAMES[feature] || feature.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get display name for a tier
 */
export function getTierDisplayName(tier: string | undefined | null): string {
  if (!tier) return "Unknown";
  return TIER_DISPLAY_NAMES[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * Custom API Error class for handling API errors
 */
export class APIError extends Error {
  public errorCode?: string;
  public traceId?: string;
  public details?: Record<string, unknown>;

  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    // Try to extract message from backend APIError format
    const backendError = data as BackendAPIError | undefined;
    const message = backendError?.message || `API Error: ${status} ${statusText}`;
    super(message);
    this.name = "APIError";

    // Parse backend APIError format if present
    if (isBackendAPIError(data)) {
      this.errorCode = data.error_code;
      this.traceId = data.trace_id || undefined;
      this.details = data.details || undefined;
    }
  }

  /**
   * Check if this is a rate limit error
   */
  isRateLimitError(): boolean {
    return this.status === 429 || this.errorCode === "RATE_LIMIT_EXCEEDED";
  }

  /**
   * Check if this is a service unavailable error
   */
  isServiceUnavailable(): boolean {
    return this.status === 503 || this.errorCode === "SERVICE_UNAVAILABLE" || this.errorCode === "CIRCUIT_BREAKER_OPEN";
  }

  /**
   * Check if the error is retryable
   */
  isRetryable(): boolean {
    return this.status >= 500 || this.status === 429 || this.isServiceUnavailable();
  }

  /**
   * Check if this is a feature gating error (feature not available for tier)
   */
  isFeatureGatingError(): boolean {
    // Check for 403 status with feature gating data
    // The backend may return this directly (without error_code wrapper) or wrapped
    if (this.status !== 403) {
      return false;
    }
    // Check if it's feature gating data (direct or wrapped)
    return this.isFeatureGatingData(this.data);
  }

  /**
   * Get feature gating details if this is a feature gating error
   */
  getFeatureGatingDetails(): FeatureGatingDetails | null {
    if (!this.isFeatureGatingError()) {
      return null;
    }

    // The data might be nested in message as a string or as the details object
    const data = this.data as Record<string, unknown>;

    // Check if the message contains the feature gating error JSON
    if (data?.message && typeof data.message === "string") {
      try {
        // Try to parse the message as JSON (backend sometimes sends it this way)
        const parsed = JSON.parse(data.message.replace(/'/g, '"'));
        if (parsed.error === "feature_not_available") {
          return parsed as FeatureGatingDetails;
        }
      } catch {
        // Check if message contains the error pattern
        if (data.message.includes("feature_not_available")) {
          // Parse the string representation
          const match = data.message.match(/\{.*\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0].replace(/'/g, '"'));
              return parsed as FeatureGatingDetails;
            } catch {
              // Fall through
            }
          }
        }
      }
    }

    // Check if data itself is the feature gating error
    if (this.isFeatureGatingData(data)) {
      return data as unknown as FeatureGatingDetails;
    }

    return null;
  }

  /**
   * Type guard for feature gating error data
   */
  private isFeatureGatingData(data: unknown): boolean {
    if (typeof data !== "object" || data === null) {
      return false;
    }
    const obj = data as Record<string, unknown>;

    // Check for direct feature gating error structure
    if (obj.error === "feature_not_available" && obj.feature && obj.required_tier) {
      return true;
    }

    // Check for nested message containing feature gating error
    if (obj.message && typeof obj.message === "string") {
      return obj.message.includes("feature_not_available") || obj.message.includes("not available on");
    }

    return false;
  }

  /**
   * Check if this is a usage limit exceeded error
   */
  isUsageLimitError(): boolean {
    return this.status === 403 && (
      this.errorCode === "USAGE_LIMIT_EXCEEDED" ||
      (this.message?.includes("limit") && this.message?.includes("exceeded"))
    );
  }
}

/**
 * Type guard for backend APIError format
 */
function isBackendAPIError(data: unknown): data is BackendAPIError {
  return (
    typeof data === "object" &&
    data !== null &&
    "error_code" in data &&
    "message" in data
  );
}

/**
 * Generic fetch wrapper with error handling and typing
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  const method = options?.method ?? "GET";
  if (requiresCsrf(method) && !headers["X-CSRF-Token"]) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    // Emit 401 unauthorized event for auto-logout
    // Skip for auth endpoints to avoid logout loops during login/refresh
    if (response.status === 401 && !endpoint.startsWith("/auth/")) {
      emitUnauthorized();
    }

    throw new APIError(response.status, response.statusText, data);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

/**
 * GET request helper
 */
export async function apiGet<T>(
  endpoint: string,
  paramsOrHeaders?: Record<string, string | number | boolean | undefined> | Record<string, string>,
  headers?: Record<string, string>
): Promise<T> {
  let url = endpoint;
  let requestHeaders: Record<string, string> | undefined;

  // Handle both old signature (params) and new signature (headers only)
  if (paramsOrHeaders) {
    // Check if it's headers (has Authorization key) or params
    if ('Authorization' in paramsOrHeaders) {
      requestHeaders = paramsOrHeaders as Record<string, string>;
    } else if (headers) {
      // Both params and headers provided
      const searchParams = new URLSearchParams();
      Object.entries(paramsOrHeaders).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
      requestHeaders = headers;
    } else {
      // Just params, no headers
      const searchParams = new URLSearchParams();
      Object.entries(paramsOrHeaders).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
    }
  }

  return apiFetch<T>(url, { method: "GET", headers: requestHeaders });
}

/**
 * POST request helper
 */
export async function apiPost<T, D = unknown>(
  endpoint: string,
  data?: D,
  headers?: Record<string, string>
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
    headers,
  });
}

/**
 * API Base URL getter (for constructing URLs for PDFs, etc.)
 */
export function getApiBaseUrl(): string {
  return API_BASE;
}

/**
 * File upload helper (multipart/form-data)
 */
export async function apiUpload<T>(
  endpoint: string,
  file: File,
  fieldName = "file",
  accessToken?: string
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const formData = new FormData();
  formData.append(fieldName, file);

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    // Emit 401 unauthorized event for auto-logout
    if (response.status === 401) {
      emitUnauthorized();
    }

    throw new APIError(response.status, response.statusText, data);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}
