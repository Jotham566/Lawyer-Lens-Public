"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Search,
  Gavel,
  BookMarked,
  FileText,
  ScrollText,
  BookOpen,
  ChevronDown,
  Activity,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { surfaceClasses } from "@/lib/design-system";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { OrgSwitcher } from "./org-switcher";
import { Logo } from "./logo";
import { useAuth } from "@/components/providers";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useHasMounted } from "@/hooks/use-has-mounted";

interface HeaderRedesignProps {
  className?: string;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

const legislationItems = [
  {
    title: "Acts of Parliament",
    description: "Browse primary legislation",
    href: "/legislation/acts",
    icon: FileText,
  },
  {
    title: "Regulations",
    description: "Statutory instruments & regulations",
    href: "/legislation/regulations",
    icon: ScrollText,
  },
  {
    title: "Constitution",
    description: "The Constitution of Uganda",
    href: "/legislation/constitution",
    icon: BookOpen,
  },
];

export function HeaderRedesign({
  className,
  onMobileMenuToggle,
  isMobileMenuOpen,
}: HeaderRedesignProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { entitlements } = useEntitlements();
  const { openLogin } = useAuthModal();
  const [searchQuery, setSearchQuery] = useState("");

  // Prevent hydration mismatch with Radix UI NavigationMenu
  const mounted = useHasMounted();

  // Only show org switcher for team/enterprise tiers
  const isTeamOrEnterprise = entitlements?.tier === "team" || entitlements?.tier === "enterprise";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-glass/15 bg-background/85 shadow-soft backdrop-blur-2xl supports-[backdrop-filter]:bg-background/72",
        className
      )}
    >
      <div className="container flex h-18 items-center gap-4 overflow-x-clip px-4 py-3">
        {/* Logo */}
        <div className="mr-3 flex shrink-0 items-center max-w-[190px] sm:max-w-none">
          <Logo height={54} />
        </div>

        {/* Desktop Navigation - Only render after mount to prevent hydration mismatch */}
        {mounted ? (
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {/* Legislation Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "h-9",
                    isActive("/legislation") && "bg-accent text-accent-foreground"
                  )}
                >
                  <FileText className="ll-icon-muted mr-2 h-4 w-4" />
                  Legislation
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[420px] gap-3 p-4 md:w-[520px] md:grid-cols-2">
                    {legislationItems.map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "group ll-nav-card space-y-1",
                              pathname === item.href && "ll-nav-card-active"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <item.icon className={cn("ll-icon-muted h-4 w-4", pathname === item.href && "text-secondary-foreground")} />
                              <div className="text-sm font-medium leading-none">
                                {item.title}
                              </div>
                            </div>
                            <p className={cn("ll-subtext-muted line-clamp-2 text-sm leading-snug", pathname === item.href && "text-secondary-foreground/80")}>
                              {item.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                    <li className="col-span-2">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/legislation"
                          className="group ll-menu-item flex items-center gap-2 rounded-2xl p-3 text-sm font-medium text-primary"
                        >
                          View all legislation
                          <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        ) : (
          <Skeleton className="hidden lg:flex h-9 w-24" />
        )}

        {/* Direct Case Law Link */}
          <Button
          variant="ghost"
          size="sm"
          asChild
          className={cn(
            "hidden rounded-full lg:flex gap-2",
            isActive("/judgments") && surfaceClasses.navPillActive
          )}
        >
              <Link href="/judgments">
            <Gavel className="ll-icon-muted h-4 w-4" />
            Case Law
          </Link>
        </Button>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="mx-2 hidden max-w-xl flex-1 md:flex">
          <div className="relative w-full">
            <Search className="ll-icon-muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search legislation, cases, or ask a question..."
              className="ll-field h-10 w-full rounded-full pl-10 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Dashboard Link - Authenticated Users */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "hidden rounded-full md:flex gap-2",
                isActive("/dashboard") && surfaceClasses.navPillActive
              )}
            >
              <Link href="/dashboard">
                <Activity className="ll-icon-muted h-4 w-4" />
                <span className="hidden xl:inline">Dashboard</span>
              </Link>
            </Button>
          )}

          {/* Ask in Plain English Link */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "hidden rounded-full md:flex gap-2",
              isActive("/chat") && surfaceClasses.navPillActive
            )}
            >
              <Link
                href="/chat"
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  // Trigger login modal and preserve intended chat destination
                  openLogin("/chat");
                }
              }}
              >
              <Sparkles className="h-4 w-4 text-primary transition-colors group-hover:text-current" />
              <span className="hidden xl:inline">Ask in Plain English</span>
            </Link>
          </Button>

          {/* Library Link - Authenticated Users */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "hidden rounded-full md:flex gap-2",
                isActive("/library") && surfaceClasses.navPillActive
              )}
            >
              <Link href="/library">
                <BookMarked className="ll-icon-muted h-4 w-4" />
                <span className="hidden xl:inline">Library</span>
              </Link>
            </Button>
          )}

          {/* Pricing Link - Prominent for non-authenticated or free users */}
          {!isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden rounded-full sm:flex gap-2"
            >
              <Link href="/pricing">
                <Sparkles className="h-4 w-4 text-primary transition-colors group-hover:text-current" />
                <span>Pricing</span>
              </Link>
            </Button>
          )}

          {/* Organization Switcher - Only for Team/Enterprise tiers */}
          {isAuthenticated && isTeamOrEnterprise && <OrgSwitcher className="hidden lg:flex" />}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <UserMenu />

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileMenuToggle}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Search Bar — hidden on chat page where chat input serves as search */}
      <div className={cn("container px-4 pb-3 md:hidden", pathname.startsWith("/chat") && "hidden")}>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="ll-icon-muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search..."
              className="h-10 w-full rounded-full pl-10 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>
    </header>
  );
}
