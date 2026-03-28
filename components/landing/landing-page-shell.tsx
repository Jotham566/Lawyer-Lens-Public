"use client";

import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { LandingHeader } from "./landing-header";
import { LandingFooter } from "./landing-footer";

/**
 * Shared shell for public pages that should use the landing header/footer.
 * Used by /pricing, /about, /privacy, /terms, /help, /waitlist etc.
 */
export function LandingPageShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <LandingHeader />
      <main className="min-h-screen pt-32">{children}</main>
      <LandingFooter />
    </AuthModalProvider>
  );
}
