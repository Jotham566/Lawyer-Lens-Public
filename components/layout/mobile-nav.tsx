"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquareText,
  FileText,
  Gavel,
  BookMarked,
  Search,
  ChevronRight,
  ScrollText,
  BookOpen,
  Activity,
  Settings,
  Building2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { surfaceClasses } from "@/lib/design-system";
import { useAuth } from "@/components/providers";
import { Logo } from "./logo";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mainNavItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Ask in Plain English",
    href: "/chat",
    icon: Sparkles,
    description: "AI-powered legal answers",
  },
  {
    title: "Search",
    href: "/search",
    icon: Search,
    description: "Find documents",
  },
  {
    title: "My Library",
    href: "/library",
    icon: BookMarked,
    description: "Saved documents",
  },
];

const legislationItems = [
  {
    title: "All Legislation",
    href: "/legislation",
    icon: FileText,
  },
  {
    title: "Acts of Parliament",
    href: "/legislation/acts",
    icon: FileText,
  },
  {
    title: "Regulations",
    href: "/legislation/regulations",
    icon: ScrollText,
  },
  {
    title: "Constitution",
    href: "/legislation/constitution",
    icon: BookOpen,
  },
];

const judgmentsItems = [
  {
    title: "All Courts",
    href: "/judgments",
    icon: Gavel,
  },
  {
    title: "Supreme Court",
    href: "/judgments/supreme-court",
  },
  {
    title: "Court of Appeal",
    href: "/judgments/court-of-appeal",
  },
  {
    title: "Constitutional Court",
    href: "/judgments/constitutional-court",
  },
  {
    title: "High Court",
    href: "/judgments/high-court",
  },
];

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [legislationOpen, setLegislationOpen] = useState(
    pathname.startsWith("/legislation") || pathname.startsWith("/browse/acts") || pathname.startsWith("/browse/regulations")
  );
  const [judgmentsOpen, setJudgmentsOpen] = useState(
    pathname.startsWith("/judgments") || pathname.startsWith("/browse/judgments")
  );

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="ll-slide-panel w-80 bg-background p-0">
        <SheetHeader className="p-5">
          <SheetTitle>
            <Logo height={140} />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation menu for Law Lens Uganda
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col overflow-y-auto px-3 pb-5">
          {/* Dashboard Link - Authenticated Users */}
          {isAuthenticated && (
            <>
              <nav className="mb-4 flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => onOpenChange(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-3xl border border-transparent px-3 py-3",
                  isActive("/dashboard")
                    ? surfaceClasses.rowInteractiveActive
                    : surfaceClasses.rowInteractive
                )}
              >
                  <Activity className={cn("ll-icon-muted h-5 w-5", isActive("/dashboard") && "text-secondary-foreground")} />
                  <div className="flex-1">
                    <div className="font-medium">Dashboard</div>
                    <div className={cn("ll-subtext-muted text-xs", isActive("/dashboard") && "text-secondary-foreground/80")}>
                      Your personalized overview
                    </div>
                  </div>
                </Link>
              </nav>
              <div className="mb-4 h-px bg-border/60" />
            </>
          )}

          {/* Main Navigation */}
          <nav className="flex flex-col gap-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-3xl border border-transparent px-3 py-3",
                  isActive(item.href)
                    ? surfaceClasses.rowInteractiveActive
                    : surfaceClasses.rowInteractive
                )}
              >
                <item.icon className={cn("ll-icon-muted h-5 w-5", isActive(item.href) && "text-secondary-foreground")} />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  {item.description && (
                    <div className={cn("ll-subtext-muted text-xs", isActive(item.href) && "text-secondary-foreground/80")}>
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          <div className="my-4 h-px bg-border/60" />

          {/* Legislation Section */}
          <div>
            <Collapsible open={legislationOpen} onOpenChange={setLegislationOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-auto w-full justify-between rounded-3xl border border-transparent px-3 py-3",
                    isActive("/legislation") && surfaceClasses.navPillActive
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={cn("ll-icon-muted h-5 w-5", isActive("/legislation") && "text-secondary-foreground")} />
                    <span className="font-medium">Legislation</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "ll-icon-muted h-4 w-4 transition-transform",
                      isActive("/legislation") && "text-secondary-foreground",
                      legislationOpen && "rotate-90"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                <nav className="mt-2 flex flex-col gap-1 pl-4">
                  {legislationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "group flex items-center gap-2 rounded-[1rem] border border-transparent px-3 py-2.5 text-sm",
                        isActive(item.href)
                          ? surfaceClasses.rowInteractiveActive
                          : surfaceClasses.rowInteractive
                      )}
                    >
                      {item.icon && (
                        <item.icon className={cn("ll-icon-muted h-4 w-4", isActive(item.href) && "text-secondary-foreground")} />
                      )}
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Judgments Section */}
          <div className="mt-2">
            <Collapsible open={judgmentsOpen} onOpenChange={setJudgmentsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-auto w-full justify-between rounded-3xl border border-transparent px-3 py-3",
                    isActive("/judgments") && surfaceClasses.navPillActive
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Gavel className={cn("ll-icon-muted h-5 w-5", isActive("/judgments") && "text-secondary-foreground")} />
                    <span className="font-medium">Case Law</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "ll-icon-muted h-4 w-4 transition-transform",
                      isActive("/judgments") && "text-secondary-foreground",
                      judgmentsOpen && "rotate-90"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                <nav className="mt-2 flex flex-col gap-1 pl-4">
                  {judgmentsItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "group flex items-center gap-2 rounded-[1rem] px-3 py-2.5 text-sm",
                        isActive(item.href)
                          ? surfaceClasses.rowInteractiveActive
                          : surfaceClasses.rowInteractive
                      )}
                    >
                      {item.icon && (
                        <item.icon className={cn("ll-icon-muted h-4 w-4", isActive(item.href) && "text-secondary-foreground")} />
                      )}
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Account Section - Authenticated Users */}
          {isAuthenticated && (
            <>
              <div className="my-4 h-px bg-border/60" />
              <nav className="flex flex-col gap-2">
                <Link
                  href="/settings"
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-3xl px-3 py-3",
                    isActive("/settings") && !pathname.includes("/organization")
                      ? surfaceClasses.rowInteractiveActive
                      : surfaceClasses.rowInteractive
                  )}
                >
                  <Settings className={cn("ll-icon-muted h-5 w-5", isActive("/settings") && !pathname.includes("/organization") && "text-secondary-foreground")} />
                  <span className="font-medium">Settings</span>
                </Link>
                <Link
                  href="/settings/organization"
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-3xl px-3 py-3",
                    isActive("/settings/organization")
                      ? surfaceClasses.rowInteractiveActive
                      : surfaceClasses.rowInteractive
                  )}
                >
                  <Building2 className={cn("ll-icon-muted h-5 w-5", isActive("/settings/organization") && "text-secondary-foreground")} />
                  <span className="font-medium">Organization</span>
                </Link>
              </nav>
            </>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Bottom tab bar navigation for mobile.
 * Provides quick access to main features.
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/legislation", icon: FileText, label: "Laws" },
    { href: "/chat", icon: MessageSquareText, label: "Ask" },
    { href: "/judgments", icon: Gavel, label: "Cases" },
    { href: "/library", icon: BookMarked, label: "Saved" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-2 left-3 right-3 z-50 rounded-full bg-popover/90 p-1.5 shadow-floating backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-around">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "group flex flex-1 flex-col items-center justify-center gap-1 rounded-full py-2",
              isActive(tab.href)
                ? "bg-secondary text-secondary-foreground"
                : "ll-row-interactive text-muted-foreground"
            )}
          >
            <tab.icon className="ll-icon-muted h-5 w-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
