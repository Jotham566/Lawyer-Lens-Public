/**
 * Progress announcer hook — sr-only live regions for long-running async
 * work. Two channels: phase (always announced) and percent (5%-bucketed
 * throttle). Critical for blind users on /research and /contracts where
 * the workflow runs 30+ seconds.
 *
 * Tests cover:
 * - Throttle: percent updates within a 5% bucket don't re-announce.
 * - Boundary: crossing a 5% boundary does re-announce.
 * - Phase channel ignores throttle: every phase change announces.
 * - Completion / error overrides phase channel and always announces.
 */
import { renderHook } from "@testing-library/react";
import { useProgressAnnouncement } from "@/hooks/use-progress-announcement";

function getPhaseEl(): HTMLElement | null {
  return document.querySelector("[data-a11y='phase-announcer']");
}
function getProgressEl(): HTMLElement | null {
  return document.querySelector("[data-a11y='progress-announcer']");
}

describe("useProgressAnnouncement", () => {
  it("creates two sr-only live regions on mount and removes them on unmount", () => {
    const { unmount } = renderHook(() =>
      useProgressAnnouncement({
        phase: "researching",
        message: null,
        percent: 0,
      })
    );
    const phase = getPhaseEl();
    const progress = getProgressEl();
    expect(phase).toBeInTheDocument();
    expect(progress).toBeInTheDocument();
    expect(phase).toHaveAttribute("role", "status");
    expect(phase).toHaveAttribute("aria-live", "polite");
    expect(phase).toHaveClass("sr-only");
    unmount();
    expect(getPhaseEl()).toBeNull();
    expect(getProgressEl()).toBeNull();
  });

  it("announces a humanised phase on first phase change", () => {
    renderHook(() =>
      useProgressAnnouncement({
        phase: "researching",
        message: "Searching judgments…",
        percent: 0,
      })
    );
    expect(getPhaseEl()?.textContent).toContain("Researching");
    expect(getPhaseEl()?.textContent).toContain("Searching judgments");
  });

  it("re-announces on phase change", () => {
    const { rerender } = renderHook(
      ({ phase }: { phase: string }) =>
        useProgressAnnouncement({ phase, message: null, percent: 0 }),
      { initialProps: { phase: "researching" } }
    );
    expect(getPhaseEl()?.textContent).toContain("Researching");
    rerender({ phase: "writing" });
    expect(getPhaseEl()?.textContent).toContain("Writing the report");
  });

  it("throttles progress to 5% buckets", () => {
    const { rerender } = renderHook(
      ({ percent }: { percent: number }) =>
        useProgressAnnouncement({ phase: "researching", message: null, percent }),
      { initialProps: { percent: 12 } }
    );
    // 12 -> bucket 10
    expect(getProgressEl()?.textContent).toBe("10% complete");
    // Within the same bucket — should NOT update
    rerender({ percent: 13 });
    expect(getProgressEl()?.textContent).toBe("10% complete");
    rerender({ percent: 14 });
    expect(getProgressEl()?.textContent).toBe("10% complete");
    // Crossing into the next bucket
    rerender({ percent: 16 });
    expect(getProgressEl()?.textContent).toBe("15% complete");
  });

  it("skips the 0% bucket so we don't announce a useless mount value", () => {
    renderHook(() =>
      useProgressAnnouncement({ phase: null, message: null, percent: 0 })
    );
    expect(getProgressEl()?.textContent).toBe("");
  });

  it("completion override always announces, regardless of phase tracking", () => {
    type Props = { phase: string | null; completionMessage: string | null };
    const { rerender } = renderHook(
      ({ phase, completionMessage }: Props) =>
        useProgressAnnouncement({
          phase,
          message: null,
          percent: 100,
          completionMessage,
        }),
      { initialProps: { phase: "writing", completionMessage: null } as Props }
    );
    expect(getPhaseEl()?.textContent).toContain("Writing");
    rerender({ phase: "writing", completionMessage: "Research complete. Report ready." });
    expect(getPhaseEl()?.textContent).toBe("Research complete. Report ready.");
  });

  it("error override always announces", () => {
    type Props = { errorMessage: string | null };
    const { rerender } = renderHook(
      ({ errorMessage }: Props) =>
        useProgressAnnouncement({
          phase: "researching",
          message: null,
          percent: 50,
          errorMessage,
        }),
      { initialProps: { errorMessage: null } as Props }
    );
    rerender({ errorMessage: "Provider timeout — retrying" });
    expect(getPhaseEl()?.textContent).toBe("Provider timeout — retrying");
  });
});
