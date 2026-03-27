"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopBar } from "./dashboard-topbar";
import { MobileNav, MobileBottomNav } from "./mobile-nav";
import { SkipLink } from "@/components/skip-link";
import { GlobalUsageAlert } from "@/components/entitlements/usage-indicator";
import { ScreenReaderAnnouncer } from "@/components/accessibility";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { BackToTop } from "@/components/common/back-to-top";

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Dashboard shell for authenticated users.
 * Sidebar (desktop) + top bar + content area.
 * Mobile: top bar with hamburger + bottom tab bar.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isChatRoute = pathname?.startsWith("/chat");

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Screen reader announcements */}
      <ScreenReaderAnnouncer />
      <SkipLink />

      {/* Desktop sidebar — always visible on lg+ */}
      <DashboardSidebar />

      {/* Right side: top bar + content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <DashboardTopBar
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Banners */}
        <GlobalUsageAlert />
        <EmailVerificationBanner />

        {/* Mobile nav sheet */}
        <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

        {/* Main content */}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          className={`flex-1 pb-16 lg:pb-0 focus:outline-none ${
            isChatRoute ? "overflow-hidden" : "overflow-auto"
          }`}
          aria-label="Main content"
        >
          {children}
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav />

        {/* Back to top — appears after scrolling down */}
        {!isChatRoute && <BackToTop />}
      </div>
    </div>
  );
}
