"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Logo } from "@/components/layout/logo";

const UG_URL = process.env.NEXT_PUBLIC_UG_URL || "https://ug.lawlens.io";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/40 bg-background/90 backdrop-blur-xl shadow-soft"
          : "bg-transparent"
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
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          <a
            href={`${UG_URL}/login`}
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Log In
          </a>
          <Link
            href="/contact"
            className="inline-flex h-9 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Request Demo
          </Link>
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
            <hr className="my-2 border-border/40" />
            <a
              href={`${UG_URL}/login`}
              className="rounded-lg px-3 py-2.5 text-base font-semibold text-muted-foreground"
            >
              Log In
            </a>
            <Link
              href="/contact"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Request Demo
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
