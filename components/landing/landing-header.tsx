"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/components/providers";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
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
  const { openLogin } = useAuthModal();
  const { isAuthenticated, user } = useAuth();

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
      >
        <div className="mx-auto flex items-center justify-between px-6 py-4 lg:px-12 xl:px-16">
          {/* Logo */}
          <Logo height={155} className="shrink-0" />

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
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
                  className="group inline-flex h-9 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Go to Dashboard
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/settings"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/20 text-xs font-bold text-brand-gold transition-colors hover:bg-brand-gold/30"
                  title={user?.full_name || user?.email || "Account"}
                >
                  {initials}
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  className="inline-flex h-9 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Request Demo
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
                    className="mt-1 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
                  >
                    Request Demo
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <DemoRequestModal open={showDemoModal} onOpenChange={setShowDemoModal} />
      <ContactModal open={showContactModal} onOpenChange={setShowContactModal} />
    </>
  );
}
