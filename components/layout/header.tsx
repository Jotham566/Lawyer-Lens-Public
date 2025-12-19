"use client";

import Link from "next/link";
import { Menu, Bell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { SearchBar } from "./search-bar";
import { useUIStore } from "@/lib/stores";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { sidebar, setSidebarOpen } = useUIStore();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(!sidebar.isOpen)}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search Bar - grows to fill space */}
      <div className="flex-1 md:max-w-xl">
        <SearchBar />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 border-b">
              <p className="text-sm font-medium">Notifications</p>
            </div>
            <div className="px-3 py-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You&apos;re all caught up
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/preferences" className="text-xs text-center w-full justify-center">
                Notification Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Quick Links */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              Quick Links
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/browse/acts">Browse Acts</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/browse/judgments">Browse Judgments</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/browse/regulations">Browse Regulations</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/chat">Legal Assistant</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pricing" className="flex items-center">
                <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                View Plans
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help">Help & FAQ</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
