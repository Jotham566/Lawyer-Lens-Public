"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { HeaderRedesign } from "./header-redesign";
import { MobileNav, MobileBottomNav } from "./mobile-nav";
import { SkipLink } from "@/components/skip-link";
import { GlobalUsageAlert } from "@/components/entitlements/usage-indicator";

interface AppShellProps {
  children: React.ReactNode;
}

// Routes that should not show the main app shell (they have their own layout)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

/**
 * Application shell component that wraps the main content.
 * Manages the new navigation structure with header, mobile nav, and bottom tabs.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current route is an auth route - if so, skip the shell
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Skip link for accessibility */}
      <SkipLink />

      {/* Header with navigation */}
      <HeaderRedesign
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      {/* Global usage warning banner */}
      <GlobalUsageAlert />

      {/* Mobile navigation sheet */}
      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      {/* Main content - with padding for bottom nav on mobile */}
      <main id="main-content" tabIndex={-1} className="flex-1 pb-16 lg:pb-0 focus:outline-none">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
