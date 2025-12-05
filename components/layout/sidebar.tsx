"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  BookOpen,
  FileText,
  Scale,
  Gavel,
  ScrollText,
  MessageSquare,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Logo } from "./logo";
import { useUIStore } from "@/lib/stores";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { title: "Home", href: "/", icon: Home },
  { title: "Search", href: "/search", icon: Search },
  { title: "Legal Assistant", href: "/chat", icon: MessageSquare },
];

const browseNavItems: NavItem[] = [
  { title: "All Documents", href: "/browse", icon: BookOpen },
  { title: "Acts", href: "/browse/acts", icon: FileText },
  { title: "Judgments", href: "/browse/judgments", icon: Gavel },
  { title: "Regulations", href: "/browse/regulations", icon: ScrollText },
  { title: "Constitution", href: "/browse/constitution", icon: Scale },
];

const secondaryNavItems: NavItem[] = [
  { title: "Help & FAQ", href: "/help", icon: HelpCircle },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { sidebar, setSidebarCollapsed } = useUIStore();
  const { isCollapsed } = sidebar;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-3">
          <Logo collapsed={isCollapsed} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>

            <Separator className="mx-2" />

            {/* Browse Section */}
            <div className="space-y-1">
              {!isCollapsed && (
                <span className="mb-2 block px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Browse
                </span>
              )}
              {browseNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2">
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </aside>
    </TooltipProvider>
  );
}

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function NavLink({ item, isActive, isCollapsed }: NavLinkProps) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.title}
          {item.badge && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
