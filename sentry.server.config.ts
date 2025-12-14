/**
 * Sentry Server Configuration
 *
 * This file configures Sentry for server-side error tracking.
 * The DSN should be configured via environment variable.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production" && !!SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (set by CI/CD)
  release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Server-side filtering
  beforeSend(event, hint) {
    const error = hint?.originalException;

    // Filter out expected errors
    if (error instanceof Error) {
      // Don't send 404s
      if (error.message.includes("ENOENT")) {
        return null;
      }

      // Don't send connection refused errors (external service down)
      if (error.message.includes("ECONNREFUSED")) {
        return null;
      }
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Next.js specific
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],
});
