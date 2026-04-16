"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";
import { useAuth } from "@/components/providers";

interface AppShellProps {
  children: React.ReactNode;
  /**
   * Whether the initial page load came from the landing domain
   * (lawlens.io / www.lawlens.io). Forwarded by the server root layout
   * from the `x-ll-domain` header set by the middleware.
   *
   * Only affects how we classify pathname="/" — a bare "/" on the
   * landing domain is the marketing home (rendered raw), whereas "/"
   * on the product domain is the app root (goes through the shell).
   * All other paths are classified by pathname alone.
   */
  initialIsLandingDomain?: boolean;
}

// Routes that bypass the shell entirely (they have their own layout)
const AUTH_ROUTES = [
  "/login", "/register", "/forgot-password", "/reset-password", "/verify-email",
  "/invite", "/auth/callback", "/account/delete",
];

// Landing routes bypass the shell (they have their own landing layout)
const LANDING_PREFIX = "/landing";

// Pages that always bypass the app shell (landing header/footer regardless of auth)
const LANDING_PAGES = ["/pricing", "/about", "/privacy", "/terms", "/waitlist", "/help"];

// Public-access routes that unauthenticated users can view (with their own layouts)
const PUBLIC_CONTENT_ROUTES = [
  "/judgments", "/legislation", "/document", "/browse", "/search",
];

/**
 * Application shell — three states:
 *
 * 1. **No shell** for auth routes, landing routes, and public pages (they have their own layouts)
 * 2. **DashboardShell** (sidebar + topbar) for authenticated users on app routes
 * 3. **Redirect to /login** for unauthenticated users on protected routes
 */
export function AppShell({ children, initialIsLandingDomain = false }: AppShellProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // Auth routes — no shell at all (auth layout handles these)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Landing routes — no shell (landing layout handles these).
  //   - `/landing/*`: direct URL visits to the rewritten route group
  //   - one of the explicit LANDING_PAGES (e.g. /pricing, /terms)
  //   - pathname "/" when the request originally hit the landing
  //     domain (lawlens.io/). We can't detect this from pathname alone
  //     because middleware rewrites `/` → `/landing` *internally*, so
  //     usePathname() still sees "/". The server root layout forwards
  //     the domain-origin signal via initialIsLandingDomain.
  const isLandingPage =
    pathname.startsWith(LANDING_PREFIX) ||
    LANDING_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    (initialIsLandingDomain && pathname === "/");
  if (isLandingPage) {
    return <>{children}</>;
  }

  // While auth is loading, show minimal loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Authenticated users → dashboard shell
  if (isAuthenticated) {
    return <DashboardShell>{children}</DashboardShell>;
  }

  // Public content routes that unauthenticated users can browse
  const isPublicContent = PUBLIC_CONTENT_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  if (isPublicContent) {
    return <DashboardShell>{children}</DashboardShell>;
  }

  // Unauthenticated users on protected routes → redirect to login
  return <RedirectToLogin returnTo={pathname} />;
}

/**
 * Redirects unauthenticated users to login, preserving the return URL.
 * Shows a clean loading state during redirect — never the old public shell.
 */
function RedirectToLogin({ returnTo }: { returnTo: string | null }) {
  const router = useRouter();

  useEffect(() => {
    const loginUrl = returnTo && returnTo !== "/"
      ? `/login?returnTo=${encodeURIComponent(returnTo)}`
      : "/login";
    router.replace(loginUrl);
  }, [returnTo, router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
