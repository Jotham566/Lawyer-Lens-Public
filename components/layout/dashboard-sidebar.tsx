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
  FlaskConical,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useEntitlements } from "@/hooks/use-entitlements";
import { trackFeatureEntry, type ToolKey } from "@/lib/analytics/track";
import { Logo } from "./logo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Match sub-routes (e.g. /legislation/acts matches /legislation) */
  matchPrefix?: boolean;
  /**
   * Optional entitlement key. Typed as the analytics ``ToolKey`` union
   * (not plain string) so a typo at the config site fails to compile —
   * silently emitting a bogus ``tool`` value to analytics would corrupt
   * the discoverability dashboard.
   */
  featureKey?: ToolKey;
}

const primaryNav: NavItem[] = [
  { label: "Ask Ben", href: "/chat", icon: MessageSquareText, matchPrefix: true },
  { label: "Laws of Uganda", href: "/legislation", icon: BookOpen, matchPrefix: true },
  { label: "Case Law", href: "/judgments", icon: Gavel, matchPrefix: true },
  { label: "Regulatory Compliance", href: "/compliance", icon: ShieldCheck, matchPrefix: true },
  { label: "Internal KB", href: "/knowledge-base", icon: Database, matchPrefix: true },
  { label: "My Workspace", href: "/workspace", icon: LayoutDashboard, matchPrefix: true },
];

// Premium "Tools" section. These are real features users keep missing
// because they only appear in the chat composer dropdown — making them
// first-class nav entries closes the discoverability gap. Kept in their
// own section so a free-tier user sees the Pro badge without confusion
// about which items are gated.
const toolsNav: NavItem[] = [
  {
    label: "Deep Research",
    href: "/research",
    icon: FlaskConical,
    matchPrefix: true,
    featureKey: "deep_research",
  },
  {
    label: "Contract Drafting",
    href: "/contracts",
    icon: PenTool,
    matchPrefix: true,
    featureKey: "contract_drafting",
  },
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
  const { hasFeature, hasInitialized } = useEntitlements();

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(pathname, item);
    // Only mark as locked AFTER entitlements have actually loaded.
    // useEntitlements().hasFeature() returns false during initial fetch,
    // which would briefly show a "Pro" badge to entitled users — exactly
    // the entitlement flicker this discoverability rollout was supposed
    // to avoid. hasInitialized is the project's standard "don't flash"
    // signal.
    const locked =
      item.featureKey && hasInitialized ? !hasFeature(item.featureKey) : false;
    // Only track entry-point clicks for Tools items (the discoverability
    // metric that gates Phase 2/3). Primary nav clicks aren't part of
    // the remediation analytics.
    const featureKey = item.featureKey;
    const trackOnClick = featureKey
      ? () => trackFeatureEntry("sidebar", featureKey)
      : undefined;

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={trackOnClick}
          className={cn(
            "ll-sidebar-nav-button",
            active && "ll-sidebar-nav-button-active"
          )}
          aria-label={
            locked ? `${item.label} (Pro feature)` : undefined
          }
        >
          <span className="flex items-center gap-3">
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">{item.label}</span>
            {locked && (
              <Badge
                variant="outline"
                className="h-5 shrink-0 rounded-full border-brand-gold/50 bg-brand-gold/10 px-2 text-[10px] font-semibold uppercase tracking-wider text-brand-gold"
              >
                Pro
              </Badge>
            )}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo — links to landing page */}
      <div className="flex h-16 items-center px-5">
        <Logo href="/landing" />
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 px-3 py-4" aria-label="Primary">
        <ul className="space-y-1">{primaryNav.map(renderNavItem)}</ul>

        {/* Tools section — premium features. Kept as a separate group so the
            "Pro" badges read as a coherent tier rather than scattered locks. */}
        <div className="mt-6">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
            Tools
          </p>
          <ul className="space-y-1">{toolsNav.map(renderNavItem)}</ul>
        </div>
      </nav>

      {/* Secondary navigation */}
      <div className="px-3 pb-4">
        <div className="mb-2 h-px bg-sidebar-border/60" />
        <ul className="space-y-1">{secondaryNav.map(renderNavItem)}</ul>
      </div>
    </aside>
  );
}
