"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquareText,
  BookOpen,
  Gavel,
  ShieldCheck,
  Database,
  LayoutDashboard,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { surfaceClasses } from "@/lib/design-system";
import { Logo } from "./logo";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const primaryNavItems = [
  { title: "Ask Ben", href: "/chat", icon: MessageSquareText, description: "AI-powered legal answers" },
  { title: "Laws of Uganda", href: "/legislation", icon: BookOpen, description: "Acts, regulations, constitution" },
  { title: "Case Law", href: "/judgments", icon: Gavel, description: "Court decisions" },
  { title: "Regulatory Compliance", href: "/compliance", icon: ShieldCheck, description: "Compliance tracking" },
  { title: "Internal KB", href: "/knowledge-base", icon: Database, description: "Knowledge base" },
  { title: "My Workspace", href: "/workspace", icon: LayoutDashboard, description: "Your documents & research" },
];

const secondaryNavItems = [
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Help & Support", href: "/help", icon: HelpCircle },
];

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="ll-slide-panel w-80 bg-background p-0">
        <SheetHeader className="p-5">
          <SheetTitle>
            <Logo height={52} />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation menu for Law Lens Uganda
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col overflow-y-auto px-3 pb-5">
          {/* Primary Navigation */}
          <nav className="flex flex-col gap-1">
            {primaryNavItems.map((item) => (
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
                <item.icon className={cn("h-5 w-5 shrink-0", isActive(item.href) ? "text-secondary-foreground" : "ll-icon-muted")} />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  {item.description && (
                    <div className={cn("text-xs", isActive(item.href) ? "text-secondary-foreground/80" : "ll-subtext-muted")}>
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          {/* Secondary Navigation */}
          <div className="my-4 h-px bg-border/60" />
          <nav className="flex flex-col gap-1">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-3xl px-3 py-3",
                  isActive(item.href)
                    ? surfaceClasses.rowInteractiveActive
                    : surfaceClasses.rowInteractive
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive(item.href) ? "text-secondary-foreground" : "ll-icon-muted")} />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Bottom tab bar navigation for mobile.
 * 5 tabs: Ask Ben (center), Laws, Cases, KB, Workspace.
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/legislation", icon: BookOpen, label: "Laws" },
    { href: "/judgments", icon: Gavel, label: "Cases" },
    { href: "/chat", icon: MessageSquareText, label: "Ask Ben" },
    { href: "/knowledge-base", icon: Database, label: "KB" },
    { href: "/workspace", icon: LayoutDashboard, label: "Workspace" },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
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
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
