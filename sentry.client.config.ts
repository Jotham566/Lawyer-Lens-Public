/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for client-side error tracking.
 * The DSN should be configured via environment variable.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Replace UUIDs, human-readable document ids (AKN/HRI pattern like
 * "FooAct-1997-6"), and long hex/base64 ids in URL paths with `:id`.
 * Applied to event.request.url and any breadcrumb URL before upload.
 *
 * Sentry events otherwise carry full paths which, for a legal-
 * document app, frequently embed tenant-owned identifiers
 * (contract session ids, chat sessions, document uuids). Keeping
 * them out of the Sentry backend is a no-cost hygiene win.
 */
function scrubPathIds(url: string): string {
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
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Generic identifier-scrubber applicable to both ErrorEvent and
 * TransactionEvent (Sentry narrows them to different types; both
 * expose `request.url` and `breadcrumbs[].data.url`). The loose type
 * here reflects the shared shape without importing Sentry's internal
 * event types.
 */
function scrubIdentifiers<T extends { request?: { url?: string }; breadcrumbs?: unknown[] }>(
  event: T,
): T {
  if (event.request?.url) {
    event.request.url = scrubPathIds(event.request.url);
  }
  if (Array.isArray(event.breadcrumbs)) {
    for (const crumb of event.breadcrumbs) {
      const data = (crumb as { data?: { url?: unknown } } | undefined)?.data;
      if (data && typeof data.url === "string") {
        data.url = scrubPathIds(data.url);
      }
    }
  }
  return event;
}

Sentry.init({
  dsn: SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production" && !!SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session Replay (optional)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% when error occurs

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (set by CI/CD)
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Filtering
  beforeSend(event, hint) {
    // Filter out certain errors
    const error = hint?.originalException;

    // Don't send network errors (user offline, etc.)
    if (error instanceof TypeError && error.message.includes("NetworkError")) {
      return null;
    }

    // Don't send cancelled requests
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }

    // Scrub identifiers from URLs / request paths before the event
    // reaches Sentry. Paths like /contracts/<uuid>, /chat/<session_id>,
    // /documents/<hri>/<doc_id> end up in event.request.url and the
    // breadcrumbs, which would otherwise export tenant-owned ids to
    // Sentry's backend.
    return scrubIdentifiers(event);
  },

  beforeSendTransaction(event) {
    return scrubIdentifiers(event);
  },

  // Only send explicit `user.id` / email if we set it. Without this,
  // the Next.js integration sometimes attaches browser metadata that
  // can correlate to a user across sessions.
  sendDefaultPii: false,

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    // Chrome extensions
    /^chrome:\/\//,
    // Firefox extensions
    /^resource:\/\//,
    // Safari extensions
    /^safari-extension:\/\//,
    // Common benign errors
    "ResizeObserver loop",
    "Non-Error promise rejection",
  ],

  // Ignore certain URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Safari extensions
    /^safari-extension:\/\//i,
  ],

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text for privacy
      maskAllText: true,
      // Block all media
      blockAllMedia: true,
    }),
  ],
});
