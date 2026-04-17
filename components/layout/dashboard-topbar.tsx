"use client";

import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { surfaceClasses } from "@/lib/design-system";

interface DashboardTopBarProps {
  onMobileMenuToggle?: () => void;
}

/** Maps pathname prefixes to human-readable breadcrumb labels. */
function getBreadcrumb(pathname: string): string {
  if (pathname.startsWith("/chat")) return "Ask Ben";
  if (pathname.startsWith("/legislation")) return "Laws of Uganda";
  if (pathname.startsWith("/judgments")) return "Case Law";
  if (pathname.startsWith("/compliance")) return "Regulatory Compliance";
  if (pathname.startsWith("/knowledge-base")) return "Internal KB";
  if (pathname.startsWith("/workspace")) return "My Workspace";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/help")) return "Help & Support";
  if (pathname.startsWith("/search")) return "Search";
  if (pathname.startsWith("/research")) return "Deep Research";
  if (pathname.startsWith("/contracts")) return "Contract Drafting";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/billing")) return "Billing";
  if (pathname.startsWith("/pricing")) return "Pricing";
  if (pathname.startsWith("/document")) return "Document";
  if (pathname.startsWith("/library")) return "Library";
  return "Home";
}

export function DashboardTopBar({ onMobileMenuToggle }: DashboardTopBarProps) {
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      {/* Left: Mobile hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle — hidden on desktop where sidebar is visible */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 lg:hidden ${surfaceClasses.iconButton}`}
          onClick={onMobileMenuToggle}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb label is visual chrome, NOT the page's semantic heading.
            Each page owns its own <h1>. Keeping this as <h1> on every route
            caused duplicate H1s (topbar + page hero). */}
        <p className="text-sm font-semibold text-foreground">{breadcrumb}</p>
      </div>

      {/* Right: Search, theme, user */}
      <div className="flex items-center gap-2">
        {/* Global search trigger */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 ${surfaceClasses.iconButton}`}
          onClick={() => {
            // Dispatch Cmd+K / Ctrl+K to open command palette
            const event = new KeyboardEvent("keydown", {
              key: "k",
              code: "KeyK",
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
          aria-label="Search (Cmd+K)"
        >
          <Search className="h-4 w-4" />
        </Button>

        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
