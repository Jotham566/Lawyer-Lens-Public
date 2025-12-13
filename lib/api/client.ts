/**
 * API Client for Law Lens Public Portal
 *
 * Provides typed API calls to the backend services.
 * Compatible with backend APIError format (error_code, message, details, trace_id).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

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

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
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
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  let url = endpoint;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url = `${endpoint}?${queryString}`;
    }
  }

  return apiFetch<T>(url, { method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T, D = unknown>(
  endpoint: string,
  data?: D
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * API Base URL getter (for constructing URLs for PDFs, etc.)
 */
export function getApiBaseUrl(): string {
  return API_BASE;
}
