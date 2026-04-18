"use client";

import { useEffect, useRef } from "react";

interface ProgressAnnouncementArgs {
  /** Current phase or status string (e.g. "researching", "writing"). */
  phase: string | null | undefined;
  /** Human-readable progress message ("Drafting introduction…"). */
  message: string | null | undefined;
  /** Integer percent 0-100, or null/undefined when unknown. */
  percent: number | null | undefined;
  /** Optional terminal-state announcement override (e.g. "Research complete"). */
  completionMessage?: string | null;
  /** Optional terminal-error announcement override. */
  errorMessage?: string | null;
}

/**
 * Hook variant: imperatively maintains body-level sr-only live regions
 * for long-running async work. Implemented as a hook (not a JSX
 * component) because the parent surfaces have many conditional return
 * paths and we'd otherwise need to thread the announcer through every
 * branch. Hooks run on every render regardless of which JSX path is
 * returned.
 *
 * Two channels so progress noise never drowns out important transitions:
 *
 * 1. **Phase channel** (polite): fires on every phase change AND on
 *    completion / error. Never throttled.
 * 2. **Progress channel** (polite): fires when the percent crosses a
 *    5% boundary. Throttled so a screen reader user isn't spammed
 *    with "37%, 38%, 39%…" every second.
 *
 * The DOM nodes are appended to document.body so they survive any
 * subtree re-mount; that's what makes this safe to call from a parent
 * with many conditional returns.
 */
export function useProgressAnnouncement(args: ProgressAnnouncementArgs): void {
  const phaseElRef = useRef<HTMLDivElement | null>(null);
  const progressElRef = useRef<HTMLDivElement | null>(null);
  const lastPhaseRef = useRef<string | null>(null);
  const lastBucketRef = useRef<number | null>(null);

  // One-time setup: create the two live regions and append to body.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const phaseEl = document.createElement("div");
    phaseEl.setAttribute("role", "status");
    phaseEl.setAttribute("aria-live", "polite");
    phaseEl.setAttribute("aria-atomic", "true");
    phaseEl.className = "sr-only";
    phaseEl.dataset.a11y = "phase-announcer";
    document.body.appendChild(phaseEl);
    phaseElRef.current = phaseEl;

    const progressEl = document.createElement("div");
    progressEl.setAttribute("role", "status");
    progressEl.setAttribute("aria-live", "polite");
    progressEl.setAttribute("aria-atomic", "true");
    progressEl.className = "sr-only";
    progressEl.dataset.a11y = "progress-announcer";
    document.body.appendChild(progressEl);
    progressElRef.current = progressEl;

    return () => {
      phaseEl.remove();
      progressEl.remove();
      phaseElRef.current = null;
      progressElRef.current = null;
      lastPhaseRef.current = null;
      lastBucketRef.current = null;
    };
  }, []);

  // Phase / terminal-state channel
  useEffect(() => {
    const el = phaseElRef.current;
    if (!el) return;
    if (args.errorMessage) {
      el.textContent = args.errorMessage;
      lastPhaseRef.current = "error";
      return;
    }
    if (args.completionMessage) {
      el.textContent = args.completionMessage;
      lastPhaseRef.current = "complete";
      return;
    }
    const next = args.phase ?? null;
    if (next && next !== lastPhaseRef.current) {
      lastPhaseRef.current = next;
      const human = humaniseStatus(next);
      el.textContent = args.message ? `${human}. ${args.message}` : human;
    }
  }, [args.phase, args.message, args.completionMessage, args.errorMessage]);

  // 5%-bucketed progress channel
  useEffect(() => {
    const el = progressElRef.current;
    if (!el) return;
    if (args.percent == null || !Number.isFinite(args.percent)) return;
    const bucket = Math.floor(Math.min(100, Math.max(0, args.percent)) / 5) * 5;
    if (bucket !== lastBucketRef.current) {
      lastBucketRef.current = bucket;
      // Skip the 0% bucket; it's not informative and would announce on every mount.
      if (bucket > 0) {
        el.textContent = `${bucket}% complete`;
      }
    }
  }, [args.percent]);
}

function humaniseStatus(status: string): string {
  // Lightweight mapping; falls back to title-cased input for unknowns.
  const map: Record<string, string> = {
    created: "Session created",
    clarifying: "Clarifying your request",
    brief_review: "Awaiting brief approval",
    researching: "Researching",
    writing: "Writing the report",
    drafting: "Drafting the contract",
    review: "Awaiting your review",
    approval: "Awaiting approval",
    complete: "Complete",
    error: "An error occurred",
    failed: "Failed",
  };
  if (status in map) return map[status]!;
  return status
    .split(/[_\s-]+/)
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}
