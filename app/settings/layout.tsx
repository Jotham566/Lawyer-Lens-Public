"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Building2,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNavItems = [
  {
    title: "Profile",
    href: "/settings",
    icon: User,
  },
  {
    title: "Organization",
    href: "/settings/organization",
    icon: Building2,
  },
  {
    title: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
  },
  {
    title: "Preferences",
    href: "/settings/preferences",
    icon: Bell,
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: Shield,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-full md:w-56 shrink-0">
            <ul className="space-y-1">
              {settingsNavItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/settings" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
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
