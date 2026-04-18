"use client";

import { Loader2, RefreshCcw, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface LiveProgressShellProps {
  /** Sidebar headline, e.g. "Live Progress" or "Generating Draft". */
  title: string;
  /** One-line description of the current step. Receives the highest visual weight. */
  statusMessage: string;
  /** 0-100 percent value for the top-line progress bar. */
  progressPercent: number;
  /** Optional secondary line beside the percent (e.g. "3/5 topics closed"). */
  progressMeta?: ReactNode;
  /**
   * Product-specific stats grid (e.g. research = Active topics + Checkpoints,
   * contracts = none). Slot is purely additive — passing nothing is fine.
   */
  statsGrid?: ReactNode;
  /** Offline state. When isOnline=false we render the offline banner. */
  isOnline?: boolean;
  /** Hydration guard so SSR doesn't flash an offline banner. */
  isHydrated?: boolean;
  /** True briefly after a reconnect; renders the resync banner. */
  wasOffline?: boolean;
  /** Product-specific content rendered beneath the chrome (topic cards, stage timeline, etc.). */
  children?: ReactNode;
  className?: string;
}

/**
 * Shared chrome for in-flight workspace progress sidebars.
 *
 * Both /research (researching/writing phase) and /contracts (drafting
 * phase) rendered nearly-identical sidebar chrome — a title, a status
 * line, a progress bar, optional stats, an offline banner — but in
 * two completely separate JSX blocks. Subtle drift accumulated:
 * different spacing, different progress-bar heights, different
 * offline copy. The 2026-04-18 UX audit called this out as M1 —
 * "two unrelated in-progress UIs for the same product family".
 *
 * Extracting the common chrome here means both products share the
 * outer container (so they look like the same product), while the
 * inner content (topic cards for research, stage timeline for
 * contracts) stays product-specific because the underlying work
 * shapes really are different (parallel topics vs sequential
 * stages).
 */
export function LiveProgressShell({
  title,
  statusMessage,
  progressPercent,
  progressMeta,
  statsGrid,
  isOnline = true,
  isHydrated = true,
  wasOffline = false,
  children,
  className,
}: LiveProgressShellProps) {
  const clampedPercent = Math.max(0, Math.min(100, progressPercent));
  const visiblePercent = Math.max(clampedPercent, 5); // never disappear visually

  return (
    <div className={cn("space-y-6 p-5", className)}>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h3>
        <div className="mt-4 space-y-4">
          <p className="text-sm font-medium leading-relaxed text-foreground">{statusMessage}</p>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>{Math.round(clampedPercent)}% complete</span>
              {progressMeta ? <span>{progressMeta}</span> : null}
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(clampedPercent)}
              aria-label={statusMessage}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${visiblePercent}%` }}
              />
            </div>
          </div>

          {statsGrid ? <div className="grid grid-cols-2 gap-3 text-xs">{statsGrid}</div> : null}
        </div>
      </div>

      {!isOnline && isHydrated && (
        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-primary/10 p-3 text-xs text-foreground">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>Offline. Run continues in the background.</div>
        </div>
      )}

      {wasOffline && (
        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-primary/10 p-3 text-xs text-foreground">
          <RefreshCcw className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>Connection restored. Re-syncing…</div>
        </div>
      )}

      {children ? (
        <>
          <div className="h-px bg-border" />
          {children}
        </>
      ) : null}
    </div>
  );
}

interface LiveProgressStatProps {
  label: string;
  value: ReactNode;
}

/** Small uniform card for the statsGrid slot. Matches the pre-extract styling. */
export function LiveProgressStat({ label, value }: LiveProgressStatProps) {
  return (
    <div className="surface-inset px-3 py-3">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

/** Loader-spinner icon helper so callers don't need to import Loader2 separately. */
export function LiveProgressSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />;
}
