"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Building2,
  Settings,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEntitlements } from "@/hooks/use-entitlements";

// Individual tiers don't need organization management
const INDIVIDUAL_TIERS = ["free", "professional"];

// Navigation items with optional team-only flag
const settingsNavItems = [
  {
    title: "Profile",
    href: "/settings",
    icon: User,
    teamOnly: false,
  },
  {
    title: "Organization",
    href: "/settings/organization",
    icon: Building2,
    teamOnly: true, // Only show for Team/Enterprise tiers
  },
  {
    title: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    teamOnly: false,
  },
  {
    title: "Preferences",
    href: "/settings/preferences",
    icon: Bell,
    teamOnly: false,
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: Shield,
    teamOnly: false,
  },
  {
    title: "Activity",
    href: "/settings/activity",
    icon: Activity,
    teamOnly: false,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { entitlements } = useEntitlements();

  // Check if user is on an individual tier
  const userTier = entitlements?.tier?.toLowerCase() || "free";
  const isIndividualTier = INDIVIDUAL_TIERS.includes(userTier);

  // Filter nav items based on tier
  const visibleNavItems = settingsNavItems.filter(
    (item) => !item.teamOnly || !isIndividualTier
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Section label for the settings tab nav. Each child page owns
            its own <h1> via PageHeader. */}
        <div className="mb-6 flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <p className="text-lg font-semibold text-foreground">Settings</p>
        </div>

        {/* Horizontal tab navigation */}
        <nav className="relative mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Right fade hint for scroll affordance on mobile */}
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
          <div className="flex gap-1 overflow-x-auto scrollbar-hide rounded-xl bg-surface-container-high/50 p-1">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/settings" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-200",
                    isActive
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
