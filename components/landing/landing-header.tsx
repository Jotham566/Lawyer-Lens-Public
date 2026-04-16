"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/components/providers";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useGetStarted } from "@/hooks/use-get-started";
import { BetaAccessModal } from "@/components/beta/beta-access-modal";
import { DemoRequestModal } from "./demo-request-modal";
import { ContactModal } from "./contact-modal";

const navLinks = [
  { label: "Product", href: "/landing#product" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { openLogin } = useAuthModal();
  const { isAuthenticated, user, logout } = useAuth();
  const { handleGetStarted, showWaitlist, setShowWaitlist } = useGetStarted();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogin = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      openLogin();
    },
    [openLogin]
  );

  // Get user initials for avatar
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border/40 bg-background/90 backdrop-blur-xl shadow-soft"
            : "bg-background/80 backdrop-blur-md"
        )}
        style={{ top: "var(--landing-beta-banner-height, 0px)" }}
      >
        <div className="mx-auto flex items-center justify-between px-6 py-4 lg:px-12 xl:px-16">
          {/* Logo — always links to landing page */}
          <div className="-ml-3.5">
            <Logo height={64} className="shrink-0" href="/landing" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </button>
          </nav>

          {/* Desktop CTA — changes based on auth state */}
          <div className="hidden items-center gap-4 md:flex">
            {isAuthenticated ? (
              <>
                <Link
                  href="/chat"
                  className="group inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Go to Dashboard
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                {/* User avatar with dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex h-11 items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-container-high"
                    title={user?.full_name || user?.email || "Account"}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/20 text-xs font-bold text-brand-gold">
                      {initials}
                    </span>
                    <svg
                      className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <>
                      {/* Backdrop to close menu */}
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border/60 bg-card p-1.5 shadow-floating dark:border-glass">
                        <div className="border-b border-border/30 px-3 py-2.5 mb-1">
                          <p className="text-sm font-semibold truncate">{user?.full_name || "User"}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <Link
                          href="/chat"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-container-high"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-container-high"
                        >
                          Settings
                        </Link>
                        <div className="mt-1 border-t border-border/30 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  className="py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Request Demo
                </button>
                {/* Primary CTA — self-serve. Everything else in the
                    nav is evaluation/sales. Users who just want to
                    try the product should have a one-click path
                    from here into register/chat. */}
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Start Free
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
            <nav className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-surface-container-high"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setShowContactModal(true);
                }}
                className="rounded-lg px-3 py-2.5 text-left text-base font-semibold text-foreground transition-colors hover:bg-surface-container-high"
              >
                Contact
              </button>
              <hr className="my-2 border-border/40" />

              {isAuthenticated ? (
                <>
                  <Link
                    href="/chat"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-surface-container-high"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-base font-semibold text-muted-foreground"
                  >
                    {user?.full_name || "Account Settings"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="rounded-lg px-3 py-2.5 text-left text-base font-semibold text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      setMobileOpen(false);
                      handleLogin(e);
                    }}
                    className="rounded-lg px-3 py-2.5 text-left text-base font-semibold text-muted-foreground"
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setShowDemoModal(true);
                    }}
                    className="rounded-lg px-3 py-2.5 text-left text-base font-semibold text-muted-foreground"
                  >
                    Request Demo
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      setMobileOpen(false);
                      handleGetStarted(e);
                    }}
                    className="mt-1 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
                  >
                    Start Free
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <DemoRequestModal open={showDemoModal} onOpenChange={setShowDemoModal} />
      <ContactModal open={showContactModal} onOpenChange={setShowContactModal} />
      {/* Opened by handleGetStarted when beta mode is still on. No-op
          once backend /beta/mode returns { enabled: false }. */}
      <BetaAccessModal open={showWaitlist} onOpenChange={setShowWaitlist} />
    </>
  );
}
