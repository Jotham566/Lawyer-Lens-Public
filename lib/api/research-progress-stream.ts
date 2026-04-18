/**
 * High-level orchestration for the research progress live stream.
 *
 * Wraps the low-level ``streamResearchProgress`` (which just opens an
 * authenticated EventSource) with the lifecycle logic that the
 * ``/research`` page needs:
 *
 * 1. **Token acquisition.** If the caller doesn't already hold a fresh
 *    ``stream_token`` (POST endpoints like ``/approve`` / ``/resume``
 *    return responses without one), fetch the session via GET, which
 *    mints a token as a side effect.
 * 2. **Cancellation guard.** If the parent React tree unmounts (or
 *    re-invokes the stream) while ``ensureToken`` is in flight, the
 *    later EventSource open is suppressed. Without this, an unmount
 *    that lands between dispatch and resolution leaves a live
 *    EventSource with no cleanup hook attached — a real socket leak.
 * 3. **Fallback to polling.** If token mint fails or the SSE chain
 *    (initial connect + single token-refresh retry) gives up, the
 *    caller is signalled to fall back to polling. The worker keeps
 *    running on the server regardless.
 *
 * Pure function: no React, no setState. The caller wires its own
 * state setters into the callbacks. This is what makes the
 * orchestration unit-testable without rendering a component (the
 * Codex-flagged test gap on ``startProgressStream``).
 */

import {
  getResearchSession,
  streamResearchProgress,
  type StreamProgress,
} from "./research";

export interface ProgressStreamCallbacks {
  /** Fires before any async work — UI can render "connecting…". */
  onConnecting?: () => void;
  /** Fires for each progress event delivered by the SSE stream. */
  onProgress: (p: StreamProgress) => void;
  /** Fires when the stream signals completion. */
  onComplete: () => void | Promise<void>;
  /**
   * Fires when token mint fails OR the SSE chain has tried + retried +
   * given up. Caller typically falls back to polling.
   */
  onFallbackNeeded: () => void;
}

export interface ProgressStreamHandle {
  /** Cancels in-flight token mint and closes any open EventSource. */
  stop: () => void;
}

/** Test seam — inject mocks for the API calls. */
export interface ProgressStreamDeps {
  getSession?: typeof getResearchSession;
  openStream?: typeof streamResearchProgress;
}

export function subscribeToResearchProgress(args: {
  sessionId: string;
  streamToken?: string | null;
  callbacks: ProgressStreamCallbacks;
  deps?: ProgressStreamDeps;
}): ProgressStreamHandle {
  const { sessionId, streamToken, callbacks } = args;
  const getSession = args.deps?.getSession ?? getResearchSession;
  const openStream = args.deps?.openStream ?? streamResearchProgress;

  let sseCleanup: (() => void) | null = null;
  let cancelled = false;

  callbacks.onConnecting?.();

  const ensureToken = async (): Promise<string | null> => {
    if (streamToken) return streamToken;
    try {
      const fresh = await getSession(sessionId);
      return fresh.stream_token ?? null;
    } catch {
      return null;
    }
  };

  void ensureToken().then((token) => {
    if (cancelled) return;
    if (!token) {
      callbacks.onFallbackNeeded();
      return;
    }
    sseCleanup = openStream(
      sessionId,
      token,
      callbacks.onProgress,
      () => {
        // Wrap onComplete so any thrown promise rejection inside the
        // caller's handler is contained — the stream already closed.
        void Promise.resolve(callbacks.onComplete()).catch(() => {
          // Caller's onComplete should handle its own errors. Swallow
          // here so we don't generate an unhandled rejection if it
          // forgets.
        });
      },
      () => {
        // SSE chain gave up (initial + one token-refresh retry both
        // errored). Hand control back to the caller's fallback.
        callbacks.onFallbackNeeded();
      },
    );
  });

  return {
    stop: () => {
      cancelled = true;
      if (sseCleanup) sseCleanup();
    },
  };
}
