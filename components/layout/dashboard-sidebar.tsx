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
import { Logo } from "./logo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Match sub-routes (e.g. /legislation/acts matches /legislation) */
  matchPrefix?: boolean;
}

const primaryNav: NavItem[] = [
  { label: "Ask Ben", href: "/chat", icon: MessageSquareText, matchPrefix: true },
  { label: "Laws of Uganda", href: "/legislation", icon: BookOpen, matchPrefix: true },
  { label: "Case Law", href: "/judgments", icon: Gavel, matchPrefix: true },
  { label: "Regulatory Compliance", href: "/compliance", icon: ShieldCheck, matchPrefix: true },
  { label: "Internal KB", href: "/knowledge-base", icon: Database, matchPrefix: true },
  { label: "My Workspace", href: "/workspace", icon: LayoutDashboard, matchPrefix: true },
];

const secondaryNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings, matchPrefix: true },
  { label: "Help & Support", href: "/help", icon: HelpCircle },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.matchPrefix && pathname.startsWith(item.href + "/")) return true;
  return false;
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <Logo />
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "ll-sidebar-nav-button",
                    active && "ll-sidebar-nav-button-active"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Secondary navigation */}
      <div className="px-3 pb-4">
        <div className="mb-2 h-px bg-sidebar-border/60" />
        <ul className="space-y-1">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "ll-sidebar-nav-button",
                    active && "ll-sidebar-nav-button-active"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
