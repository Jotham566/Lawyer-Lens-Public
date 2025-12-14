/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for client-side error tracking.
 * The DSN should be configured via environment variable.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

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

    return event;
  },

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
