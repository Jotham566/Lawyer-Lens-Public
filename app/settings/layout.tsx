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
import { surfaceClasses } from "@/lib/design-system";
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
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-full md:w-56 shrink-0">
            <ul className="space-y-1">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/settings" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group",
                        isActive
                          ? surfaceClasses.sidebarNavButtonActive
                          : surfaceClasses.sidebarNavButton
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", !isActive && "ll-icon-muted")} />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
