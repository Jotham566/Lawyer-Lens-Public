/**
 * URL hygiene for telemetry / error reporting.
 *
 * Used by both ``sentry.client.config.ts`` and ``sentry.server.config.ts``
 * to scrub identifiers and credentials out of any URL before it leaves
 * the application. Two passes:
 *
 * 1. **Path identifiers** — UUIDs, AKN-style human-readable ids
 *    ("Income-Tax-Act-1997-11"), and long opaque tokens are replaced
 *    with stable placeholders so dashboards group routes correctly
 *    without leaking tenant-owned ids.
 * 2. **Sensitive query params** — values for known credential-bearing
 *    keys (the SSE ``stream_token`` shipped with the Phase 1 hotfix,
 *    OAuth ``code`` / ``state``, generic ``token`` / ``access_token``)
 *    are replaced with ``:redacted``. The query-param pass is the
 *    defense-in-depth layer against the Codex-flagged Sentry
 *    breadcrumb leak path.
 *
 * Add new query-bearing credentials to ``SENSITIVE_QUERY_PARAMS``
 * whenever a feature introduces one.
 */
export const SENSITIVE_QUERY_PARAMS = new Set<string>([
  "stream_token",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "code",
  "state",
]);

/**
 * Replace identifiers and sensitive query values in a URL. Returns
 * the original string on any URL parse error so the calling Sentry
 * pipeline never throws on a malformed input.
 */
export function scrubUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.pathname = parsed.pathname
      // UUID v1-v5
      .replace(
        /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        "/:id",
      )
      // AKN-style human-readable id: letters/digits separated by hyphens
      // with at least two segments, e.g. "Income-Tax-Act-1997-11".
      .replace(/\/[A-Za-z0-9]+(-[A-Za-z0-9]+){2,}/g, "/:hri")
      // Long hex / base64url tokens (>=24 chars).
      .replace(/\/[A-Za-z0-9_-]{24,}/g, "/:token");

    // Redact sensitive query-param values. Collect keys first because
    // URLSearchParams.set mutates while iteration is open.
    const sensitiveKeys: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
        sensitiveKeys.push(key);
      }
    });
    for (const key of sensitiveKeys) {
      parsed.searchParams.set(key, ":redacted");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
