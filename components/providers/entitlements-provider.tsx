"use client";

import { ReactNode, useEffect } from "react";
import { EntitlementsContext, useEntitlementsProvider } from "@/hooks/use-entitlements";
import { useAuth } from "./auth-provider";

interface EntitlementsProviderProps {
  children: ReactNode;
}

export function EntitlementsProvider({ children }: EntitlementsProviderProps) {
  const entitlements = useEntitlementsProvider();
  const { isAuthenticated, accessToken } = useAuth();

  // Refresh entitlements when auth state changes
  useEffect(() => {
    entitlements.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);

  return (
    <EntitlementsContext.Provider value={entitlements}>
      {children}
    </EntitlementsContext.Provider>
  );
}
