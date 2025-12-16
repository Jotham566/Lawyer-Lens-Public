"use client";

import { ReactNode } from "react";
import { EntitlementsContext, useEntitlementsProvider } from "@/hooks/use-entitlements";

interface EntitlementsProviderProps {
  children: ReactNode;
}

export function EntitlementsProvider({ children }: EntitlementsProviderProps) {
  const entitlements = useEntitlementsProvider();

  return (
    <EntitlementsContext.Provider value={entitlements}>
      {children}
    </EntitlementsContext.Provider>
  );
}
