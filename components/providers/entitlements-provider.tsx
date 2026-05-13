"use client";

import { ReactNode, useEffect } from "react";
import { EntitlementsContext, useEntitlementsProvider } from "@/hooks/use-entitlements";
import { useAuth } from "./auth-provider";

interface EntitlementsProviderProps {
  children: ReactNode;
}

const ENTITLEMENTS_REFRESH_INTERVAL_MS = 2 * 60 * 1000;

export function EntitlementsProvider({ children }: EntitlementsProviderProps) {
  const entitlements = useEntitlementsProvider();
  const { isAuthenticated } = useAuth();
  const { refresh } = entitlements;

  useEffect(() => {
    if (!isAuthenticated) {
      void refresh({ reset: true, skipFetch: true });
      return;
    }

    void refresh({ forceLoading: true, reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Picks up out-of-band tier/usage changes (e.g., admin tier overrides,
  // subscription transitions on the billing webhook) without forcing the
  // user to log out and back in. Refetches on tab focus and on a short
  // interval while the tab is in the foreground.
  useEffect(() => {
    if (!isAuthenticated) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const refetch = () => {
      void refresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };

    window.addEventListener("focus", refetch);
    document.addEventListener("visibilitychange", handleVisibility);
    intervalId = setInterval(refetch, ENTITLEMENTS_REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", refetch);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, refresh]);

  return (
    <EntitlementsContext.Provider value={entitlements}>
      {children}
    </EntitlementsContext.Provider>
  );
}
