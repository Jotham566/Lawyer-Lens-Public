/**
 * subscribeToResearchProgress — orchestration tests.
 *
 * The Codex review on Phase 1 flagged this code path as untested
 * (testing specialist confidence 9): "reconnect/retry logic is now
 * the load-bearing reliability path for SSE streaming and will
 * silently regress." These tests cover the four real branches by
 * injecting mock implementations of getResearchSession and
 * streamResearchProgress.
 *
 * Tests cover:
 * - Happy path: streamToken supplied → opens stream immediately
 * - No token in scope → fetches session, opens stream with fresh token
 * - getSession throws (auth expired, 404) → onFallbackNeeded fires
 * - Session has no stream_token → onFallbackNeeded fires
 * - SSE chain gives up → onFallbackNeeded fires
 * - stop() called before token resolves → no EventSource opens
 * - stop() after stream is open → SSE cleanup invoked
 * - onComplete error is swallowed (no unhandled rejection)
 */
import { subscribeToResearchProgress } from "@/lib/api/research-progress-stream";
import type { ResearchSession, StreamProgress } from "@/lib/api/research";

function makeSession(streamToken: string | null = "tok-123"): ResearchSession {
  return {
    session_id: "sess-1",
    query: "test",
    status: "researching",
    phase: "research",
    clarifying_questions: null,
    created_at: new Date().toISOString(),
    stream_token: streamToken,
  };
}

function makeMocks() {
  const getSession = jest.fn();
  const openStream = jest.fn();
  const onProgress = jest.fn();
  const onComplete = jest.fn();
  const onFallbackNeeded = jest.fn();
  const onConnecting = jest.fn();
  return { getSession, openStream, onProgress, onComplete, onFallbackNeeded, onConnecting };
}

describe("subscribeToResearchProgress — token acquisition", () => {
  it("opens the stream immediately when a streamToken is in scope (no GET)", async () => {
    const m = makeMocks();
    const cleanup = jest.fn();
    m.openStream.mockReturnValue(cleanup);

    subscribeToResearchProgress({
      sessionId: "sess-1",
      streamToken: "tok-from-caller",
      callbacks: {
        onConnecting: m.onConnecting,
        onProgress: m.onProgress,
        onComplete: m.onComplete,
        onFallbackNeeded: m.onFallbackNeeded,
      },
      deps: { getSession: m.getSession, openStream: m.openStream },
    });

    // ensureToken's promise still resolves on the microtask queue.
    await Promise.resolve();
    await Promise.resolve();

    expect(m.onConnecting).toHaveBeenCalledTimes(1);
    expect(m.getSession).not.toHaveBeenCalled();
    expect(m.openStream).toHaveBeenCalledWith(
      "sess-1",
      "tok-from-caller",
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
    expect(m.onFallbackNeeded).not.toHaveBeenCalled();
  });

  it("fetches session for a fresh token when none is in scope", async () => {
    const m = makeMocks();
    m.getSession.mockResolvedValue(makeSession("tok-fresh"));
    m.openStream.mockReturnValue(jest.fn());

    subscribeToResearchProgress({
      sessionId: "sess-1",
      callbacks: {
        onProgress: m.onProgress,
        onComplete: m.onComplete,
        onFallbackNeeded: m.onFallbackNeeded,
      },
      deps: { getSession: m.getSession, openStream: m.openStream },
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(m.getSession).toHaveBeenCalledWith("sess-1");
    expect(m.openStream).toHaveBeenCalledWith(
      "sess-1",
      "tok-fresh",
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("falls back when getSession throws (auth expired, 404, etc.)", async () => {
    const m = makeMocks();
    m.getSession.mockRejectedValue(new Error("401"));

    subscribeToResearchProgress({
      sessionId: "sess-1",
      callbacks: {
        onProgress: m.onProgress,
        onComplete: m.onComplete,
        onFallbackNeeded: m.onFallbackNeeded,
      },
      deps: { getSession: m.getSession, openStream: m.openStream },
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(m.onFallbackNeeded).toHaveBeenCalledTimes(1);
    expect(m.openStream).not.toHaveBeenCalled();
  });

  it("falls back when getSession returns no stream_token", async () => {
    const m = makeMocks();
    m.getSession.mockResolvedValue(makeSession(null));

    subscribeToResearchProgress({
      sessionId: "sess-1",
      callbacks: {
        onProgress: m.onProgress,
        onComplete: m.onComplete,
        onFallbackNeeded: m.onFallbackNeeded,
      },
      deps: { getSession: m.getSession, openStream: m.openStream },
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(m.onFallbackNeeded).toHaveBeenCalledTimes(1);
    expect(m.openStream).not.toHaveBeenCalled();
  });
});

describe("subscribeToResearchProgress — SSE event delivery", () => {
  it("forwards progress events from openStream to onProgress", async () => {
    const m = makeMocks();
    let capturedOnProgress: ((p: StreamProgress) => void) | null = null;
    m.openStream.mockImplementation((_sid, _tok, onP) => {
      capturedOnProgress = onP;
      return jest.fn();
    });

    subscribeToResearchProgress({
      sessionId: "sess-1",
      streamToken: "tok",
      callbacks: {
        onProgress: m.onProgress,
        onComplete: m.onComplete,
        onFallbackNeeded: m.onFallbackNeeded,
      },
      deps: { getSession: m.getSession, openStream: m.openStream },
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(capturedOnProgress).not.toBeNull();
    capturedOnProgress!({ phase: "researching", message: "Searching…", progress: 25 });
    expect(m.onProgress).toHaveBeenCalledWith({
      phase: "researching",
      message: "Searching…",
      progress: 25,
    });
  });

  it("invokes onComplete when openStream signals completion", async () => {
    const m = makeMocks();
    let capturedOnComplete: (() => void) | null = null;
    m.openStream.mockImplementation((_sid, _tok, _onP, onC) => {
      capturedOnComplete = onC;
      return jest.fn();
    });

    subscribeToResearchProgress({
      sessionId: "sess-1",
      streamToken: "tok",
      callbacks: {
        onProgress: m.onProgress,
        onComplete: m.onComplete,
        onFallbackNeeded: m.onFallbackNeeded,
      },
      deps: { getSession: m.getSession, openStream: m.openStream },
    });

    await Promise.resolve();
    await Promise.resolve();
    capturedOnComplete!();
    // onComplete is wrapped — give it a microtask to settle.
    await Promise.resolve();
    expect(m.onComplete).toHaveBeenCalledTimes(1);
  });

  it("falls back to polling when SSE chain gives up", async () => {
    const m = makeMocks();
    let capturedOnError: (() => void) | null = null;
    m.openStream.mockImplementation((_sid, _tok, _onP, _onC, onE) => {
      capturedOnError = onE;
      return jest.fn();
    });

    subscribeToResearchProgress({
      sessionId: "sess-1",
      streamToken: "tok",
      callbacks: {
        onProgress: m.onProgress,
        onComplete: m.onComplete,
        onFallbackNeeded: m.onFallbackNeeded,
      },
      deps: { getSession: m.getSession, openStream: m.openStream },
    });

    await Promise.resolve();
    await Promise.resolve();
    capturedOnError!();
    expect(m.onFallbackNeeded).toHaveBeenCalledTimes(1);
  });

  it("swallows promise rejections thrown by onComplete (no unhandled rejection)", async () => {
    const m = makeMocks();
    m.onComplete.mockRejectedValue(new Error("report fetch failed"));
    let capturedOnComplete: (() => void) | null = null;
    m.openStream.mockImplementation((_sid, _tok, _onP, onC) => {
      capturedOnComplete = onC;
      return jest.fn();
    });

    subscribeToResearchProgress({
      sessionId: "sess-1",
      streamToken: "tok",
      callbacks: {
        onProgress: m.onProgress,
        onComplete: m.onComplete,
        onFallbackNeeded: m.onFallbackNeeded,
      },
      deps: { getSession: m.getSession, openStream: m.openStream },
    });

    await Promise.resolve();
    await Promise.resolve();
    // Spy on process unhandled rejection so a regression here would fail.
    const unhandled = jest.fn();
    process.on("unhandledRejection", unhandled);
    capturedOnComplete!();
    await new Promise((r) => setTimeout(r, 10));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});

describe("subscribeToResearchProgress — cancellation", () => {
  it("stop() before token resolves prevents EventSource from opening", async () => {
    const m = makeMocks();
    let resolveSession: ((s: ResearchSession) => void) | null = null;
    m.getSession.mockImplementation(
      () => new Promise<ResearchSession>((r) => { resolveSession = r; }),
    );

    const handle = subscribeToResearchProgress({
      sessionId: "sess-1",
      callbacks: {
        onProgress: m.onProgress,
        onComplete: m.onComplete,
        onFallbackNeeded: m.onFallbackNeeded,
      },
      deps: { getSession: m.getSession, openStream: m.openStream },
    });

    // Cancel BEFORE the session resolves.
    handle.stop();
    resolveSession!(makeSession("tok"));
    await Promise.resolve();
    await Promise.resolve();

    expect(m.openStream).not.toHaveBeenCalled();
    expect(m.onFallbackNeeded).not.toHaveBeenCalled();
  });

  it("stop() after stream is open invokes the SSE cleanup", async () => {
    const m = makeMocks();
    const cleanup = jest.fn();
    m.openStream.mockReturnValue(cleanup);

    const handle = subscribeToResearchProgress({
      sessionId: "sess-1",
      streamToken: "tok",
      callbacks: {
        onProgress: m.onProgress,
        onComplete: m.onComplete,
        onFallbackNeeded: m.onFallbackNeeded,
      },
      deps: { getSession: m.getSession, openStream: m.openStream },
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(m.openStream).toHaveBeenCalledTimes(1);

    handle.stop();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
