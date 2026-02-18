"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Search,
  Scale,
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
import { useAuth } from "@/components/providers";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

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
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container flex h-16 items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-4">
          <Scale className="h-6 w-6 text-primary" />
          <span className="hidden font-bold text-lg sm:inline-block">
            Law Lens
          </span>
        </Link>

        {/* Desktop Navigation */}
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
                <FileText className="h-4 w-4 mr-2" />
                Legislation
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  {legislationItems.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            pathname === item.href && "bg-accent"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm font-medium leading-none">
                              {item.title}
                            </div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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
                        className="flex items-center gap-2 rounded-md p-3 text-sm font-medium text-primary hover:bg-accent"
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

        {/* Direct Case Law Link */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className={cn(
            "hidden lg:flex gap-2",
            isActive("/judgments") && "bg-accent text-accent-foreground"
          )}
        >
          <Link href="/judgments">
            <Gavel className="h-4 w-4" />
            Case Law
          </Link>
        </Button>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search legislation, cases, or ask a question..."
              className="pl-10 pr-4 h-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Dashboard Link - Authenticated Users */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "hidden md:flex gap-2",
                isActive("/dashboard") && "bg-accent text-accent-foreground"
              )}
            >
              <Link href="/dashboard">
                <Activity className="h-4 w-4" />
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
              "hidden md:flex gap-2",
              isActive("/chat") && "bg-accent text-accent-foreground"
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
              <Sparkles className="h-4 w-4 text-primary" />
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
                "hidden md:flex gap-2",
                isActive("/library") && "bg-accent text-accent-foreground"
              )}
            >
              <Link href="/library">
                <BookMarked className="h-4 w-4" />
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
              className="hidden sm:flex gap-2 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-950/50"
            >
              <Link href="/pricing">
                <Sparkles className="h-4 w-4 text-amber-500" />
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 pr-4 h-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>
    </header>
  );
}
