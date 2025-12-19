"use client";

import Link from "next/link";
import Image from "next/image";
import {
  User,
  LogOut,
  CreditCard,
  Shield,
  ChevronDown,
  Building2,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useAuthModal } from "@/components/providers";
import { useEntitlements } from "@/hooks/use-entitlements";

export function UserMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const { entitlements } = useEntitlements();
  const isFreeTier = !entitlements || entitlements.tier === "free";
  const isTeamOrEnterprise = entitlements?.tier === "team" || entitlements?.tier === "enterprise";

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated - show login/signup buttons
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex"
          onClick={() => openLogin()}
        >
          Sign in
        </Button>
        <Button size="sm" onClick={() => openRegister()}>
          Get Started
        </Button>
      </div>
    );
  }

  // Authenticated - show user dropdown
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.full_name}
                width={28}
                height={28}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <span className="hidden sm:inline max-w-[100px] truncate">
            {user.full_name.split(" ")[0]}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          {isTeamOrEnterprise && (
            <DropdownMenuItem asChild>
              <Link href="/settings/organization" className="cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                Organization
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/settings/billing" className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/security" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </Link>
          </DropdownMenuItem>
          {isFreeTier && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/pricing" className="cursor-pointer text-amber-600 dark:text-amber-400">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
