"use client";

import { ReactNode, useEffect } from "react";
import { EntitlementsContext, useEntitlementsProvider } from "@/hooks/use-entitlements";
import { useAuth } from "./auth-provider";

interface EntitlementsProviderProps {
  children: ReactNode;
}

export function EntitlementsProvider({ children }: EntitlementsProviderProps) {
  const entitlements = useEntitlementsProvider();
  const { isAuthenticated } = useAuth();

  // Refresh entitlements when auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      void entitlements.refresh({ reset: true, skipFetch: true });
      return;
    }

    // Force a foreground load and clear stale entitlements when auth context changes
    void entitlements.refresh({ forceLoading: true, reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <EntitlementsContext.Provider value={entitlements}>
      {children}
    </EntitlementsContext.Provider>
  );
}
