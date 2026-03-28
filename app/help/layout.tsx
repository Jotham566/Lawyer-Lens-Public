"use client";

import { useAuth } from "@/components/providers";
import { LandingPageShell } from "@/components/landing/landing-page-shell";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  // Authenticated users see help inside the dashboard shell (handled by AppShell)
  // so we don't wrap with LandingPageShell
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Unauthenticated users get the landing header/footer
  return <LandingPageShell>{children}</LandingPageShell>;
}
