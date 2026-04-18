/**
 * Analytics tracker — Phase 1 discoverability instrumentation.
 *
 * The tracker is the load-bearing measurement for the Phase 2/3 gate
 * decision: if entry-point clicks rise but completion doesn't, we know
 * the discoverability fix worked but the page itself is the bottleneck.
 * If clicks don't rise, the nav fix didn't move the needle.
 */
import { trackEvent, trackFeatureEntry } from "@/lib/analytics/track";

describe("analytics/track", () => {
  let trackSpy: jest.Mock;

  beforeEach(() => {
    trackSpy = jest.fn();
    (window as unknown as { umami?: { track: jest.Mock } }).umami = {
      track: trackSpy,
    };
  });

  afterEach(() => {
    delete (window as unknown as { umami?: unknown }).umami;
  });

  it("trackEvent forwards name + payload to umami", () => {
    trackEvent("test.event", { foo: "bar" });
    expect(trackSpy).toHaveBeenCalledWith("test.event", { foo: "bar" });
  });

  it("trackEvent works without payload", () => {
    trackEvent("nopayload");
    expect(trackSpy).toHaveBeenCalledWith("nopayload", undefined);
  });

  it("trackEvent never throws when umami is absent", () => {
    delete (window as unknown as { umami?: unknown }).umami;
    expect(() => trackEvent("x", { y: 1 })).not.toThrow();
  });

  it("trackEvent never throws when umami.track throws", () => {
    (window as unknown as { umami: { track: jest.Mock } }).umami.track = jest.fn(() => {
      throw new Error("network blocked");
    });
    expect(() => trackEvent("x")).not.toThrow();
  });

  it("trackFeatureEntry emits feature.entry with surface + tool", () => {
    trackFeatureEntry("sidebar", "deep_research");
    expect(trackSpy).toHaveBeenCalledWith("feature.entry", {
      surface: "sidebar",
      tool: "deep_research",
    });

    trackFeatureEntry("landing_hero_cta", "contract_drafting");
    expect(trackSpy).toHaveBeenLastCalledWith("feature.entry", {
      surface: "landing_hero_cta",
      tool: "contract_drafting",
    });
  });

  it("emits the same event name across surfaces (so dashboards aggregate cleanly)", () => {
    trackFeatureEntry("sidebar", "deep_research");
    trackFeatureEntry("mobile_drawer", "deep_research");
    trackFeatureEntry("header_quicklinks", "deep_research");
    expect(trackSpy).toHaveBeenCalledTimes(3);
    trackSpy.mock.calls.forEach(([name]) => {
      expect(name).toBe("feature.entry");
    });
  });
});

describe("analytics/track buffer (umami late-load)", () => {
  // The Phase 1 dashboard depends on capturing the very first user
  // click on a cold page. Umami loads `afterInteractive`, so without
  // buffering we'd silently drop those events and the discoverability
  // metric would underreport — exactly the signal we need to gate
  // Phase 2/3.
  //
  // Module-level buffer state means we re-import per test via
  // jest.isolateModules so each scenario starts with an empty buffer
  // and no scheduled flush timer.
  beforeEach(() => {
    jest.useFakeTimers();
    delete (window as unknown as { umami?: unknown }).umami;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    delete (window as unknown as { umami?: unknown }).umami;
  });

  it("buffers events when umami is absent and flushes once it loads", () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { trackEvent: track } = require("@/lib/analytics/track") as typeof import("@/lib/analytics/track");

      // First click happens before umami is loaded.
      track("feature.entry", { surface: "sidebar", tool: "deep_research" });
      track("feature.entry", { surface: "header_quicklinks", tool: "contract_drafting" });

      // Umami arrives a moment later (script.js loaded).
      const trackSpy = jest.fn();
      (window as unknown as { umami: { track: jest.Mock } }).umami = {
        track: trackSpy,
      };

      // Flush poll fires every 100ms.
      jest.advanceTimersByTime(150);

      expect(trackSpy).toHaveBeenCalledTimes(2);
      expect(trackSpy).toHaveBeenNthCalledWith(1, "feature.entry", {
        surface: "sidebar",
        tool: "deep_research",
      });
      expect(trackSpy).toHaveBeenNthCalledWith(2, "feature.entry", {
        surface: "header_quicklinks",
        tool: "contract_drafting",
      });
    });
  });

  it("drops the buffer (does not grow unboundedly) if umami never loads", () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { trackEvent: track } = require("@/lib/analytics/track") as typeof import("@/lib/analytics/track");

      // Spam clicks while umami is missing — buffer caps at 50.
      for (let i = 0; i < 100; i++) {
        track("feature.entry", { surface: "sidebar", tool: "deep_research" });
      }

      // Pass the timeout window without umami showing up; buffered
      // events should be dropped so we don't dump 50 stale clicks at
      // once if umami appears much later.
      jest.advanceTimersByTime(11_000);

      const trackSpy = jest.fn();
      (window as unknown as { umami: { track: jest.Mock } }).umami = {
        track: trackSpy,
      };

      // Run any remaining timers; nothing should fire.
      jest.advanceTimersByTime(500);
      expect(trackSpy).not.toHaveBeenCalled();
    });
  });
});
