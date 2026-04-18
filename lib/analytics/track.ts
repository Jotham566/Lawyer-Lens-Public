/**
 * Thin Umami tracking helper.
 *
 * Phase 1 instrumentation for the discoverability remediation plan.
 * Once Umami is loaded (script in app/layout.tsx), `window.umami.track`
 * is available client-side. This helper centralises the call so we
 * can swap providers later without touching every event site.
 *
 * Why a wrapper instead of calling `window.umami` directly:
 * - Type safety (no `any` at every call site).
 * - One place to gate behavior on env (e.g. log to console in dev).
 * - One place to enforce a stable event-name vocabulary.
 *
 * Usage:
 *   trackEvent("nav.tools.click", { surface: "sidebar", tool: "research" });
 *
 * Naming convention: lowercase dot-separated, no PII in payloads.
 */

declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, unknown>) => void;
    };
  }
}

export type EntrySurface =
  | "sidebar"
  | "mobile_drawer"
  | "header_quicklinks"
  | "landing_hero_cta"
  | "landing_final_cta"
  | "chat_tool_dropdown";

export type ToolKey = "deep_research" | "contract_drafting";

// Umami is loaded `afterInteractive` from app/layout.tsx. On a cold
// page-load, the very first user click can fire before window.umami
// exists — we'd silently drop the event and never know whether the
// new entry-point worked. Phase 1's whole job is to measure this.
//
// Solution: buffer events while umami is missing, then flush on the
// next tick once it shows up. The buffer is bounded so a permanently-
// blocked umami (ad-blocker, network failure) can't grow without
// limit; events that don't make it before the cap are dropped.
const FLUSH_BUFFER_MAX = 50;
const FLUSH_POLL_MS = 100;
const FLUSH_TIMEOUT_MS = 10_000;
let pendingEvents: Array<[string, Record<string, unknown> | undefined]> = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let flushDeadline = 0;

function startFlushPoll(): void {
  if (flushTimer || typeof window === "undefined") return;
  flushDeadline = Date.now() + FLUSH_TIMEOUT_MS;
  flushTimer = setInterval(() => {
    if (typeof window === "undefined") return;
    if (window.umami?.track) {
      try {
        for (const [name, data] of pendingEvents) {
          window.umami.track(name, data);
        }
      } catch {
        // Tracking must never break user flow.
      }
      pendingEvents = [];
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
      return;
    }
    if (Date.now() > flushDeadline) {
      // Umami never loaded (blocked / disabled). Drop the buffer so
      // we don't grow it on every subsequent navigation.
      pendingEvents = [];
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
    }
  }, FLUSH_POLL_MS);
}

/**
 * Generic tracker. Buffers events when Umami isn't yet loaded so cold
 * first-clicks aren't lost. Returns silently if buffering caps out.
 */
export function trackEvent(name: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    if (window.umami?.track) {
      window.umami.track(name, data);
      return;
    }
    // Umami not yet available — buffer up to a small cap, then schedule
    // a flush poll (no-op if one is already scheduled).
    if (pendingEvents.length < FLUSH_BUFFER_MAX) {
      pendingEvents.push([name, data]);
      startFlushPoll();
    }
  } catch {
    // Tracking must never break user flow.
  }
}

/**
 * Conventional name for "user clicked a path that leads to a feature."
 * Surface tells us which entry point worked; tool says what they wanted.
 * This is the primary signal that gates Phase 2/3 of the remediation
 * plan: if entry-point clicks rise but completion doesn't, the page
 * itself is the bottleneck.
 */
export function trackFeatureEntry(surface: EntrySurface, tool: ToolKey): void {
  trackEvent("feature.entry", { surface, tool });
}
