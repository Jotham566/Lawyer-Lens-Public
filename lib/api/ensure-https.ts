/**
 * Ensure non-localhost URLs always use HTTPS.
 * Prevents mixed-content errors when build-time env vars lose the 's' in https.
 */
export function ensureHttps(url: string): string {
  if (url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    return url.replace("http://", "https://");
  }
  return url;
}

/**
 * Get the API base URL with HTTPS enforcement.
 * Use this instead of raw `process.env.NEXT_PUBLIC_API_URL`.
 */
export function getApiUrl(): string {
  return ensureHttps(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1");
}
