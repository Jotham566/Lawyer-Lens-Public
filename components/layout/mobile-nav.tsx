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
  Scale,
  Activity,
  Settings,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/components/providers";

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
    title: "Legal Assistant",
    href: "/chat",
    icon: MessageSquareText,
    description: "Ask legal questions",
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
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Law Lens
          </SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation menu for Law Lens
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col overflow-y-auto py-4">
          {/* Dashboard Link - Authenticated Users */}
          {isAuthenticated && (
            <>
              <nav className="flex flex-col gap-1 px-2 mb-4">
                <Link
                  href="/dashboard"
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    isActive("/dashboard")
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">Dashboard</div>
                    <div className="text-xs text-muted-foreground">
                      Your personalized overview
                    </div>
                  </div>
                </Link>
              </nav>
              <div className="mb-4 border-t" />
            </>
          )}

          {/* Main Navigation */}
          <nav className="flex flex-col gap-1 px-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  isActive(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          <div className="my-4 border-t" />

          {/* Legislation Section */}
          <div className="px-2">
            <Collapsible open={legislationOpen} onOpenChange={setLegislationOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between px-3 py-2.5 h-auto",
                    isActive("/legislation") && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Legislation</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      legislationOpen && "rotate-90"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                <nav className="flex flex-col gap-1 pl-4">
                  {legislationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      {item.icon && (
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Judgments Section */}
          <div className="px-2 mt-1">
            <Collapsible open={judgmentsOpen} onOpenChange={setJudgmentsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between px-3 py-2.5 h-auto",
                    isActive("/judgments") && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Gavel className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Case Law</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      judgmentsOpen && "rotate-90"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                <nav className="flex flex-col gap-1 pl-4">
                  {judgmentsItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      {item.icon && (
                        <item.icon className="h-4 w-4 text-muted-foreground" />
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
              <div className="my-4 border-t" />
              <nav className="flex flex-col gap-1 px-2">
                <Link
                  href="/settings"
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    isActive("/settings") && !pathname.includes("/organization")
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Settings</span>
                </Link>
                <Link
                  href="/settings/organization"
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    isActive("/settings/organization")
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  <Building2 className="h-5 w-5 text-muted-foreground" />
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
              isActive(tab.href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
