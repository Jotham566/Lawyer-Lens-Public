"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { HeaderRedesign } from "./header-redesign";
import { MobileNav, MobileBottomNav } from "./mobile-nav";
import { DashboardShell } from "./dashboard-shell";
import { SkipLink } from "@/components/skip-link";
import { GlobalUsageAlert } from "@/components/entitlements/usage-indicator";
import { ScreenReaderAnnouncer } from "@/components/accessibility";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { useAuth } from "@/components/providers";
import { BackToTop } from "@/components/common/back-to-top";
import { LandingFooter } from "@/components/landing/landing-footer";

interface AppShellProps {
  children: React.ReactNode;
}

// Routes that bypass the shell entirely (they have their own layout)
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

// Landing routes bypass the shell (they have their own landing layout)
const LANDING_PREFIX = "/landing";

// Public/marketing routes that always use the header-based layout (even for authenticated users)
// Note: /help is NOT here — authenticated users see it inside the dashboard shell
const PUBLIC_HEADER_ROUTES = ["/privacy", "/terms", "/waitlist", "/help"];

// Public pages that show the landing footer (static info pages)
const FOOTER_ROUTES = ["/privacy", "/terms", "/help", "/waitlist"];

/**
 * Application shell — routes between two layouts:
 *
 * 1. **DashboardShell** (sidebar + topbar) for authenticated users on app routes
 * 2. **PublicShell** (header + bottom nav) for unauthenticated users or public pages
 * 3. **No shell** for auth routes (login, register, etc.)
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth routes — no shell at all
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Landing routes — no shell (landing has its own header/footer)
  if (pathname.startsWith(LANDING_PREFIX)) {
    return <>{children}</>;
  }

  // Authenticated users on app routes → sidebar dashboard shell
  const isPublicHeaderRoute = PUBLIC_HEADER_ROUTES.some((route) => pathname === route);
  if (isAuthenticated && !isPublicHeaderRoute) {
    return <DashboardShell>{children}</DashboardShell>;
  }

  // Should this page show the landing footer?
  const showFooter = FOOTER_ROUTES.some((route) => pathname === route);

  // Unauthenticated users or public pages → header-based layout
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <ScreenReaderAnnouncer />
      <SkipLink />

      <HeaderRedesign
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      <GlobalUsageAlert />
      <EmailVerificationBanner />

      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        className={`flex-1 pb-16 lg:pb-0 focus:outline-none ${
          pathname?.startsWith("/chat") ? "overflow-hidden" : "overflow-auto"
        }`}
        aria-label="Main content"
      >
        {children}
        {showFooter && <LandingFooter />}
      </main>

      <MobileBottomNav />

      {/* Back to top — appears after scrolling down */}
      {!pathname?.startsWith("/chat") && <BackToTop />}
    </div>
  );
}
