"use client";

import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { EntitlementsProvider } from "./entitlements-provider";
import { AuthProvider } from "./auth-provider";
import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { CommandPalette } from "@/components/command-palette";
import { OfflineBanner } from "@/components/offline-banner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <EntitlementsProvider>
            <AuthModalProvider>
              {children}
              <CommandPalette />
              <OfflineBanner />
            </AuthModalProvider>
          </EntitlementsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export { QueryProvider } from "./query-provider";
export { ThemeProvider } from "./theme-provider";
export { EntitlementsProvider } from "./entitlements-provider";
export { AuthProvider, useAuth, useRequireAuth, useRedirectIfAuthenticated } from "./auth-provider";
export { useAuthModal } from "@/components/auth/auth-modal-provider";
