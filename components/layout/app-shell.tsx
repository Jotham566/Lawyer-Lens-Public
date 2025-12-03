"use client";

import { useState } from "react";
import { HeaderRedesign } from "./header-redesign";
import { MobileNav, MobileBottomNav } from "./mobile-nav";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Application shell component that wraps the main content.
 * Manages the new navigation structure with header, mobile nav, and bottom tabs.
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Header with navigation */}
      <HeaderRedesign
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      {/* Mobile navigation sheet */}
      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      {/* Main content - with padding for bottom nav on mobile */}
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
